"use client";

import { useEffect, useState } from "react";
import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import { LeanIMT } from "@zk-kit/lean-imt";
import { createSmartAccountClient } from "permissionless";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { poseidon1, poseidon2 } from "poseidon-lite";
import { createPublicClient, encodeFunctionData, http } from "viem";
import { EntryPointVersion, entryPoint07Address } from "viem/account-abstraction";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";
import { useAccount } from "wagmi";
import { useDeployedContractInfo, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import {
  getStoredProofMetadata,
  getStoredVoteMetadata,
  hasStoredProof,
  loadCommitmentFromLocalStorage,
  notification,
  saveProofToLocalStorage,
  saveVoteToLocalStorage,
  updateVoteInLocalStorage,
} from "~~/utils/scaffold-eth";

const chains = {
  baseSepolia: {
    network: baseSepolia,
    http: "https://sepolia.base.org",
  },
  sepolia: {
    network: sepolia,
    // http: "https://sepolia.alchemyapi.io/v2/your-api-key",
  },
  mainnet: {
    network: mainnet,
    // http: "https://mainnet.alchemyapi.io/v2/your-api-key",
  },
  base: {
    network: base,
    http: "https://mainnet.base.org",
  },
};

// Change this to the chain you want to use
const CHAIN_USED = chains.baseSepolia.network;
const HTTP_CLIENT_USED = chains.baseSepolia.http;

const pimlicoUrl = `https://api.pimlico.io/v2/${CHAIN_USED.id}/rpc?apikey=${process.env.NEXT_PUBLIC_PIMLICO_API_KEY}`;

export const CombinedVoteBurnerPaymaster = ({
  contractAddress,
  leafEvents = [],
}: {
  contractAddress?: `0x${string}`;
  leafEvents?: any[];
}) => {
  const { commitmentData, voteChoice, setVoteChoice, setProofData, setCommitmentData } = useGlobalState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStoredProofData, setHasStoredProofData] = useState(false);
  const [storedVoteChoice, setStoredVoteChoice] = useState<boolean | null>(null);
  const [loadedCommitmentData, setLoadedCommitmentData] = useState<any>(null);
  const [voteStatus, setVoteStatus] = useState<"pending" | "success" | "failed" | null>(null);
  const [voteMeta, setVoteMeta] = useState<any>(null);
  const [isTxDetailsOpen, setIsTxDetailsOpen] = useState(false);
  const { address: userAddress, isConnected } = useAccount();

  const { data: votingData } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getVotingData",
    args: [userAddress],
    address: contractAddress,
  });

  const votingDataArray = votingData as unknown as any[];
  const depth = Number(votingDataArray?.[1] ?? 0);
  const root = votingDataArray?.[2] as bigint;
  const isVoter = votingDataArray?.[3] as boolean;
  const hasRegistered = votingDataArray?.[4] as boolean;

  const { data: contractInfo } = useDeployedContractInfo({ contractName: "Voting" });

  // Determine if user can vote
  const canVote = Boolean(isConnected && isVoter === true && hasRegistered === true);

  // Check for stored proof data on mount and when user/contract changes
  useEffect(() => {
    const hasProof = hasStoredProof(contractAddress, userAddress);
    setHasStoredProofData(hasProof);

    // If there's a stored proof, get the vote choice
    if (hasProof) {
      const storedProofMetadata = getStoredProofMetadata(contractAddress, userAddress);
      setStoredVoteChoice(storedProofMetadata?.voteChoice ?? null);
    } else {
      setStoredVoteChoice(null);
    }

    // Load vote status from localStorage
    const meta = getStoredVoteMetadata(contractAddress, userAddress);
    setVoteStatus((meta?.status as any) ?? null);
    setVoteMeta(meta ?? null);

    // Reset submission state when address changes
    setIsSubmitting(false);
  }, [contractAddress, userAddress]);

  // Sync vote status if localStorage changes in other contexts/tabs
  useEffect(() => {
    if (!contractAddress || !userAddress) return;
    const onStorage = () => {
      const meta = getStoredVoteMetadata(contractAddress, userAddress);
      if (meta?.status) setVoteStatus(meta.status as any);
      if (typeof meta?.voteChoice === "boolean") setStoredVoteChoice(meta.voteChoice);
      setVoteMeta(meta ?? null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [contractAddress, userAddress]);

  // Poll while pending to reflect updates written by async flows
  useEffect(() => {
    if (voteStatus !== "pending") return;
    if (!contractAddress || !userAddress) return;
    const id = setInterval(() => {
      const meta = getStoredVoteMetadata(contractAddress, userAddress);
      if (meta?.status && meta.status !== "pending") {
        setVoteStatus(meta.status as any);
        if (typeof meta.voteChoice === "boolean") setStoredVoteChoice(meta.voteChoice);
        setVoteMeta(meta ?? null);
        clearInterval(id);
      }
    }, 1500);
    return () => clearInterval(id);
  }, [voteStatus, contractAddress, userAddress]);

  // Load commitment data from localStorage on mount or when contract/user changes
  useEffect(() => {
    if (contractAddress && userAddress) {
      const storedCommitmentData = loadCommitmentFromLocalStorage(contractAddress, userAddress);
      if (storedCommitmentData) {
        setLoadedCommitmentData(storedCommitmentData);
        // If global state doesn't have commitment data, set it from localStorage
        if (!commitmentData) {
          setCommitmentData(storedCommitmentData);
        }
      }
    }
  }, [contractAddress, userAddress, commitmentData, setCommitmentData]);

  // Clear voting state when user address changes
  useEffect(() => {
    // Reset vote choice when switching addresses
    setVoteChoice(null);
  }, [userAddress, setVoteChoice]);

  // Pimlico + ERC-4337 setup (mirrors VoteWithBurnerPaymaster)

  const pimlicoClient = createPimlicoClient({
    chain: CHAIN_USED,
    transport: http(pimlicoUrl),
    entryPoint: { address: entryPoint07Address, version: "0.7" as EntryPointVersion },
  });

  const createSmartAccount = async () => {
    // Create a random owner and initialize a Safe-based smart account
    const privateKey = generatePrivateKey();
    const wallet = privateKeyToAccount(privateKey);

    const publicClient = createPublicClient({ chain: CHAIN_USED, transport: http(HTTP_CLIENT_USED) });

    const smartAccount = await toSafeSmartAccount({
      client: publicClient,
      owners: [wallet],
      version: "1.4.1",
    });

    const smartAccountClient = createSmartAccountClient({
      account: smartAccount,
      chain: CHAIN_USED,
      bundlerTransport: http(pimlicoUrl),
      paymaster: pimlicoClient,
      userOperation: {
        estimateFeesPerGas: async () => (await pimlicoClient.getUserOperationGasPrice()).fast,
      },
    });

    return {
      smartAccountClient,
      accountAddress: smartAccount.address as `0x${string}`,
      burnerAddress: wallet.address as `0x${string}`,
    };
  };

  const handleGenerateAndVote = async () => {
    try {
      setIsSubmitting(true);

      if (voteChoice === null) throw new Error("Please select Yes or No first");

      // Use commitment data from global state or loaded from localStorage as fallback
      const activeCommitmentData = commitmentData || loadedCommitmentData;

      if (
        !activeCommitmentData?.nullifier ||
        !activeCommitmentData?.secret ||
        activeCommitmentData?.index === undefined
      )
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
        activeCommitmentData.nullifier,
        activeCommitmentData.secret,
        activeCommitmentData.index as number,
        leafEvents,
        circuitData,
      );

      setProofData({ proof: generated.proof, publicInputs: generated.publicInputs });

      // Save proof data to localStorage
      saveProofToLocalStorage(
        { proof: generated.proof, publicInputs: generated.publicInputs },
        contractAddress,
        voteChoice,
        userAddress,
      );
      setHasStoredProofData(true);
      setStoredVoteChoice(voteChoice);

      // Build calldata for Voting.vote
      const proofHex = uint8ArrayToHexString(generated.proof);
      const inputsHex = normalizePublicInputsToHex32(generated.publicInputs);

      if (!contractInfo && !contractAddress) throw new Error("Contract not found");

      const callData = encodeFunctionData({
        abi: (contractInfo?.abi as any) || ([] as any),
        functionName: "vote",
        args: [proofHex, inputsHex[0], inputsHex[1], inputsHex[2], inputsHex[3]],
      });

      const { smartAccountClient, accountAddress, burnerAddress } = await createSmartAccount();

      const userOpHash = await smartAccountClient.sendTransaction({
        to: contractAddress as `0x${string}`,
        data: callData,
        value: 0n,
      });

      // Record vote as pending using the userOp hash
      saveVoteToLocalStorage(
        voteChoice,
        userOpHash,
        contractAddress,
        userAddress,
        accountAddress,
        burnerAddress,
        "pending",
      );
      setVoteStatus("pending");
      setVoteMeta(
        getStoredVoteMetadata(contractAddress, userAddress) ?? {
          voteChoice,
          txHash: userOpHash,
          status: "pending",
          contractAddress,
          userAddress,
          smartAccountAddress: accountAddress,
          burnerAddress,
          timestamp: Date.now(),
        },
      );

      const receipt = await pimlicoClient.waitForUserOperationReceipt({ hash: userOpHash });
      console.log("Transaction included:", receipt);
      const rawTxHash =
        (receipt as any)?.receipt?.transactionHash ||
        (receipt as any)?.transactionHash ||
        (receipt as any)?.hash ||
        userOpHash;
      const txHash = typeof rawTxHash === "string" ? rawTxHash : rawTxHash?.toString?.();
      if (txHash) {
        updateVoteInLocalStorage(contractAddress, userAddress, {
          txHash,
          status: "success",
          blockNumber: (receipt as any)?.receipt?.blockNumber?.toString?.(),
        });
      }
      setVoteStatus("success");
      setVoteMeta(getStoredVoteMetadata(contractAddress, userAddress));
      notification.success("Vote submitted successfully");
    } catch (err) {
      console.error(err);
      const name = (err as any)?.name || "";
      const message = (err as Error)?.message || "";
      const isTimeout =
        name.includes("WaitForUserOperationReceiptTimeoutError") ||
        message.includes("WaitForUserOperationReceiptTimeoutError") ||
        message.includes("Timed out while waiting for User Operation");

      if (isTimeout) {
        try {
          updateVoteInLocalStorage(contractAddress, userAddress, {
            status: "success",
            error: undefined,
          });
        } catch {}
        setVoteStatus("success");
        setVoteMeta(getStoredVoteMetadata(contractAddress, userAddress));
        // Optionally notify success on timeout
        // notification.success("Vote submitted (confirmation timed out, will appear shortly)");
      } else {
        notification.error(message || "Failed to submit vote");
        try {
          updateVoteInLocalStorage(contractAddress, userAddress, {
            status: "failed",
            error: message || name,
          });
        } catch {}
        setVoteStatus("failed");
        setVoteMeta(getStoredVoteMetadata(contractAddress, userAddress));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-base-100 shadow rounded-xl p-6 space-y-6 relative">
      <div className="flex justify-end">
        {voteMeta && (
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => setIsTxDetailsOpen(v => !v)}
            title="Show vote transaction details"
          >
            {isTxDetailsOpen ? "Hide tx" : "Tx details"}
          </button>
        )}
      </div>
      {isTxDetailsOpen && voteMeta && (
        <div className="absolute left-1/2 -translate-x-1/2 top-14 z-10 p-3 rounded-lg bg-base-200 shadow text-xs space-y-1 w-[min(90vw,32rem)]">
          <div>
            <span className="opacity-70">Status:</span> {voteMeta.status ?? "—"}
          </div>
          {typeof voteMeta.voteChoice === "boolean" && (
            <div>
              <span className="opacity-70">Choice:</span> {voteMeta.voteChoice ? "YES" : "NO"}
            </div>
          )}
          {voteMeta.txHash && (
            <div className="break-all">
              <span className="opacity-70">Tx hash:</span> {voteMeta.txHash}
            </div>
          )}
          {voteMeta.blockNumber && (
            <div>
              <span className="opacity-70">Block:</span> {voteMeta.blockNumber}
            </div>
          )}
          {voteMeta.smartAccountAddress && (
            <div className="break-all">
              <span className="opacity-70">Smart account:</span> {voteMeta.smartAccountAddress}
            </div>
          )}
          {voteMeta.burnerAddress && (
            <div className="break-all">
              <span className="opacity-70">Burner:</span> {voteMeta.burnerAddress}
            </div>
          )}
          {voteMeta.contractAddress && (
            <div className="break-all">
              <span className="opacity-70">Contract:</span> {voteMeta.contractAddress}
            </div>
          )}
          {voteMeta.timestamp && (
            <div>
              <span className="opacity-70">Time:</span> {new Date(voteMeta.timestamp).toLocaleString()}
            </div>
          )}
          {voteMeta.error && (
            <div className="text-error break-all">
              <span className="opacity-70">Error:</span> {voteMeta.error}
            </div>
          )}
        </div>
      )}
      {loadedCommitmentData && !commitmentData && (
        <div className="alert alert-info">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span className="text-sm">Using commitment data from previous session</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1 text-center">
          <h2 className="text-2xl font-bold">Choose your vote</h2>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            className={`btn btn-lg ${
              voteChoice === true
                ? "btn-success"
                : hasStoredProofData && storedVoteChoice === true
                  ? "btn-success"
                  : "btn-outline"
            } ${!canVote && !hasStoredProofData ? "btn-disabled" : ""}`}
            style={hasStoredProofData ? { pointerEvents: "none", cursor: "not-allowed" } : {}}
            onClick={canVote && !hasStoredProofData ? () => setVoteChoice(true) : undefined}
            disabled={!canVote && !hasStoredProofData}
          >
            Yes
          </button>
          <button
            className={`btn btn-lg ${
              voteChoice === false
                ? "btn-error"
                : hasStoredProofData && storedVoteChoice === false
                  ? "btn-error"
                  : "btn-outline"
            } ${!canVote && !hasStoredProofData ? "btn-disabled" : ""}`}
            style={hasStoredProofData ? { pointerEvents: "none", cursor: "not-allowed" } : {}}
            onClick={canVote && !hasStoredProofData ? () => setVoteChoice(false) : undefined}
            disabled={!canVote && !hasStoredProofData}
          >
            No
          </button>
        </div>
      </div>

      <div className="divider"></div>

      <div className="flex justify-center">
        {(() => {
          const isAlreadyVoted = voteStatus === "success";
          const isPendingVote = voteStatus === "pending";
          const disabled = isSubmitting || isPendingVote || isAlreadyVoted || !canVote;
          const label = isAlreadyVoted
            ? `✓ Already voted with ${storedVoteChoice === true ? "YES" : storedVoteChoice === false ? "NO" : ""}`
            : isPendingVote
              ? "Vote pending..."
              : isSubmitting
                ? "Generating & submitting..."
                : !canVote
                  ? "Must register first"
                  : "Vote";
          const variant = isAlreadyVoted
            ? "btn-success"
            : isPendingVote
              ? "btn-outline"
              : !canVote
                ? "btn-disabled"
                : "btn-primary";
          return (
            <button
              className={`btn btn-lg ${variant} ${isAlreadyVoted ? "cursor-not-allowed" : ""}`}
              onClick={disabled ? undefined : handleGenerateAndVote}
              disabled={disabled}
            >
              {label}
            </button>
          );
        })()}
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
