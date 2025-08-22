"use client";

import { useMemo, useState } from "react";
import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import { LeanIMT } from "@zk-kit/lean-imt";
import { poseidon1, poseidon2 } from "poseidon-lite";
import { useCopyToClipboard, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import { notification } from "~~/utils/scaffold-eth";

export const CombinedVote = ({
  contractAddress,
  leafEvents = [],
}: {
  contractAddress?: `0x${string}`;
  leafEvents?: any[];
}) => {
  const { commitmentData, voteChoice, setProofData, proofData } = useGlobalState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { copyToClipboard, isCopiedToClipboard } = useCopyToClipboard();

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

  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "Voting",
    address: contractAddress,
  });

  const handleCopyProofJSON = async () => {
    if (!proofData) return;

    try {
      // Convert Uint8Array to regular array for JSON serialization
      const proofArray = Array.from(proofData.proof);
      const proofJson = {
        proof: proofArray,
        publicInputs: proofData.publicInputs,
        proofHex: uint8ArrayToHexString(proofData.proof),
        publicInputsHex: normalizePublicInputsToHex32(proofData.publicInputs),
      };

      const jsonStr = JSON.stringify(proofJson, null, 2);
      await copyToClipboard(jsonStr);
      notification.success("Proof data copied to clipboard");
    } catch (error) {
      console.error("Failed to copy proof:", error);
      notification.error("Failed to copy proof data");
    }
  };

  const handleVote = async () => {
    try {
      setIsSubmitting(true);

      if (voteChoice === null) throw new Error("Please select Yes or No first");
      if (!commitmentData?.nullifier || !commitmentData?.secret || commitmentData?.index === undefined)
        throw new Error("Please register first. Missing commitment data.");
      if (!leafEvents || leafEvents.length === 0)
        throw new Error("There are no commitments yet. Please register your commitment first.");

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

      const proofHex = uint8ArrayToHexString(generated.proof);
      const inputsHex = normalizePublicInputsToHex32(generated.publicInputs);

      await writeContractAsync({
        functionName: "vote",
        args: [proofHex, inputsHex[0], inputsHex[1], inputsHex[2], inputsHex[3]],
      });

      notification.success("Vote submitted successfully");
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
        <h2 className="text-2xl font-bold">Cast your vote</h2>
        <p className="text-sm opacity-70">We will generate the ZK proof and submit your vote in one step.</p>
      </div>
      <div className="flex justify-center">
        <button className="btn btn-primary btn-lg" onClick={handleVote} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Vote now"}
        </button>
      </div>

      {/* Proof Data Section */}
      {proofData && (
        <>
          <div className="divider"></div>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Generated proof data</h3>
              <div className="flex gap-2">
                <button
                  className={`btn btn-secondary btn-sm ${isCopiedToClipboard ? "btn-success" : ""}`}
                  onClick={handleCopyProofJSON}
                >
                  {isCopiedToClipboard ? "✓ Copied!" : "Copy JSON"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-base-300 p-3">
                <div className="text-xs opacity-70 mb-1">Proof (Hex)</div>
                <code className="text-xs break-all bg-base-200 p-2 rounded block">
                  {uint8ArrayToHexString(proofData.proof)}
                </code>
              </div>
              <div className="rounded-lg border border-base-300 p-3">
                <div className="text-xs opacity-70 mb-1">Public Inputs</div>
                <code className="text-xs break-all bg-base-200 p-2 rounded block">
                  {JSON.stringify(proofData.publicInputs, null, 2)}
                </code>
              </div>
            </div>

            <div className="alert alert-success">
              <div>
                <h3 className="font-semibold">Vote submitted successfully!</h3>
                <p className="text-sm opacity-80">
                  Your ZK proof has been generated and your vote has been recorded on the blockchain. You can copy the
                  proof data above for your records.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Local helpers duplicated from GenerateProof for reuse
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
