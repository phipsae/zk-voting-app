"use client";

import { useMemo, useState } from "react";
import { UltraHonkBackend } from "@aztec/bb.js";
// @ts-ignore
import { Noir } from "@noir-lang/noir_js";
import { LeanIMT } from "@zk-kit/lean-imt";
import { createSmartAccountClient } from "permissionless";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { poseidon1, poseidon2 } from "poseidon-lite";
import { createPublicClient, encodeFunctionData, http } from "viem";
import { EntryPointVersion, entryPoint07Address } from "viem/account-abstraction";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { useDeployedContractInfo, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import { notification } from "~~/utils/scaffold-eth";

export const CombinedVoteBurnerPaymaster = ({
  contractAddress,
  leafEvents = [],
}: {
  contractAddress?: `0x${string}`;
  leafEvents?: any[];
}) => {
  const { commitmentData, voteChoice, setProofData } = useGlobalState();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: treeData } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "tree",
    address: contractAddress,
  });

  const { data: root } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getRoot",
    address: contractAddress,
  });

  const depth = useMemo(() => Number((treeData as readonly [bigint, bigint] | undefined)?.[1] ?? 0), [treeData]);

  const { data: contractInfo } = useDeployedContractInfo({ contractName: "Voting" });

  // Pimlico + ERC-4337 setup (mirrors VoteWithBurnerPaymaster)
  const apiKey = "pim_4m62oHMPzK43c7EUsXmnFa";
  const pimlicoUrl = `https://api.pimlico.io/v2/${baseSepolia.id}/rpc?apikey=${apiKey}`;
  const pimlicoClient = createPimlicoClient({
    chain: baseSepolia,
    transport: http(pimlicoUrl),
    entryPoint: { address: entryPoint07Address, version: "0.7" as EntryPointVersion },
  });

  const createSmartAccount = async () => {
    // Create a random owner and initialize a Safe-based smart account
    const privateKey = generatePrivateKey();
    const wallet = privateKeyToAccount(privateKey);

    const publicClient = createPublicClient({ chain: baseSepolia, transport: http("https://sepolia.base.org") });

    const account = await toSafeSmartAccount({
      client: publicClient,
      owners: [wallet],
      version: "1.4.1",
    });

    const smartAccountClient = createSmartAccountClient({
      account,
      chain: baseSepolia,
      bundlerTransport: http(pimlicoUrl),
      paymaster: pimlicoClient,
      userOperation: {
        estimateFeesPerGas: async () => (await pimlicoClient.getUserOperationGasPrice()).fast,
      },
    });

    return { smartAccountClient, accountAddress: account.address as `0x${string}` };
  };

  const handleGenerateAndVote = async () => {
    try {
      setIsSubmitting(true);

      if (voteChoice === null) throw new Error("Please select Yes or No first");
      if (!commitmentData?.nullifier || !commitmentData?.secret || commitmentData?.index === undefined)
        throw new Error("Please register first. Missing commitment data.");
      if (!leafEvents || leafEvents.length === 0)
        throw new Error("There are no commitments yet. Please register your commitment first.");

      // Fetch circuit and generate proof
      const response = await fetch("/api/circuit");
      if (!response.ok) throw new Error("Failed to fetch circuit data");
      const circuitData = await response.json();

      const generated = await generateProof(
        root as bigint,
        voteChoice,
        depth,
        commitmentData.nullifier,
        commitmentData.secret,
        commitmentData.index as number,
        leafEvents,
        circuitData,
      );

      setProofData({ proof: generated.proof, publicInputs: generated.publicInputs });

      // Build calldata for Voting.vote
      const proofHex = uint8ArrayToHexString(generated.proof);
      const inputsHex = normalizePublicInputsToHex32(generated.publicInputs);

      if (!contractInfo && !contractAddress) throw new Error("Contract not found");

      const callData = encodeFunctionData({
        abi: (contractInfo?.abi as any) || ([] as any),
        functionName: "vote",
        args: [proofHex, inputsHex[0], inputsHex[1], inputsHex[2], inputsHex[3]],
      });

      const { smartAccountClient } = await createSmartAccount();

      const userOpHash = await smartAccountClient.sendTransaction({
        to: (contractAddress || contractInfo?.address) as `0x${string}`,
        data: callData,
        value: 0n,
      });

      const receipt = await pimlicoClient.waitForUserOperationReceipt({ hash: userOpHash });
      console.log("Transaction included:", receipt);
      notification.success("Vote submitted successfully (gasless)");
    } catch (err) {
      console.error(err);
      notification.error((err as Error).message || "Failed to submit vote");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-base-100 shadow rounded-xl p-6 space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold">Cast your vote (Gasless)</h2>
        <p className="text-sm opacity-70">Generates your ZK proof and submits via an ERC-4337 smart account.</p>
      </div>
      <div className="flex justify-center">
        <button className="btn btn-primary btn-lg" onClick={handleGenerateAndVote} disabled={isSubmitting}>
          {isSubmitting ? "Generating & submitting..." : "Generate proof and vote"}
        </button>
      </div>
    </div>
  );
};

// Local helpers adapted from existing components
const generateProof = async (
  _root: bigint,
  _vote: boolean,
  _depth: number,
  _nullifier: string,
  _secret: string,
  _index: number,
  _leaves: any[],
  _circuitData: any,
) => {
  const nullifierHash = poseidon1([BigInt(_nullifier)]);

  const calculatedTree = new LeanIMT((a: bigint, b: bigint) => poseidon2([a, b]));
  const leaves = _leaves.map(event => event?.args.value);
  const leavesReversed = leaves.reverse();
  calculatedTree.insertMany(leavesReversed as bigint[]);
  const calculatedProof = calculatedTree.generateProof(_index);
  const sibs = calculatedProof.siblings.map(sib => sib.toString());

  const lengthDiff = 16 - sibs.length;
  for (let i = 0; i < lengthDiff; i++) {
    sibs.push("0");
  }

  const noir = new Noir(_circuitData);
  const honk = new UltraHonkBackend(_circuitData.bytecode, { threads: 1 });

  const input = {
    root: _root.toString(),
    nullifier_hash: nullifierHash.toString(),
    vote: _vote,
    depth: _depth.toString(),
    nullifier: BigInt(_nullifier).toString(),
    secret: BigInt(_secret).toString(),
    index: calculatedProof.index.toString(),
    siblings: sibs,
  };

  const { witness } = await noir.execute(input);
  const originalLog = console.log;
  console.log = () => {};
  const { proof, publicInputs } = await honk.generateProof(witness, { keccak: true });
  console.log = originalLog;
  return { proof, publicInputs };
};

const uint8ArrayToHexString = (buffer: Uint8Array): `0x${string}` => {
  const hex: string[] = [];
  buffer.forEach(i => {
    let h = i.toString(16);
    if (h.length % 2) h = "0" + h;
    hex.push(h);
  });
  return `0x${hex.join("")}`;
};

const toBytes32Hex = (value: any): `0x${string}` => {
  if (typeof value === "string" && value.startsWith("0x")) {
    const hex = value.slice(2);
    if (hex.length > 64) throw new Error("Hex value too long for bytes32");
    return `0x${hex.padStart(64, "0")}`;
  }
  if (typeof value === "boolean") {
    return `0x${(value ? 1n : 0n).toString(16).padStart(64, "0")}`;
  }
  if (typeof value === "bigint") {
    return `0x${value.toString(16).padStart(64, "0")}`;
  }
  if (typeof value === "number") {
    return `0x${BigInt(value).toString(16).padStart(64, "0")}`;
  }
  if (typeof value === "string") {
    const asBig = BigInt(value);
    return `0x${asBig.toString(16).padStart(64, "0")}`;
  }
  throw new Error("Unsupported public input type");
};

const normalizePublicInputsToHex32 = (inputs: any[]): `0x${string}`[] => inputs.map(toBytes32Hex);
