"use client";

import { useState } from "react";
import { Fr } from "@aztec/bb.js";
import { ethers } from "ethers";
import { poseidon2 } from "poseidon-lite";
import { useAccount } from "wagmi";
import { useCopyToClipboard, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import { notification } from "~~/utils/scaffold-eth";

interface CommitmentData {
  commitment: string;
  nullifier: string;
  secret: string;
  encoded: string;
}

interface CreateCommitmentProps {
  leafEvents?: any[];
  contractAddress?: `0x${string}`;
  compact?: boolean;
}

export const CreateCommitment = ({ leafEvents = [], contractAddress, compact = false }: CreateCommitmentProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [isInserted, setIsInserted] = useState(false);
  const [isAlertCollapsed, setIsAlertCollapsed] = useState(true);
  const { setCommitmentData, commitmentData } = useGlobalState();
  const { copyToClipboard, isCopiedToClipboard } = useCopyToClipboard();

  const { address: walletAddress, isConnected } = useAccount();

  const { data: isVoter } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "isVoter",
    args: [walletAddress],
    address: contractAddress,
  });

  const { data: hasRegistered } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "hasRegistered",
    args: [walletAddress],
    address: contractAddress,
  });

  const canRegister = Boolean(isConnected && isVoter !== false && hasRegistered !== true);

  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "Voting",
    address: contractAddress,
  });

  // const { writeContractAsync } = useWriteContract();
  // const writeTx = useTransactor();

  const handleGenerateCommitment = async () => {
    setIsGenerating(true);
    try {
      const data = await generateCommitment();
      setCommitmentData(data);
      return data;
    } catch (error) {
      console.error("Error generating commitment:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyJSON = async (data: any) => {
    try {
      const jsonStr = JSON.stringify(data, null, 2);
      await copyToClipboard(jsonStr);
      notification.success("Commitment data copied to clipboard");
    } catch (error) {
      console.error("Failed to copy:", error);
      notification.error("Failed to copy data");
    }
  };

  const handleInsertCommitment = async (dataOverride?: CommitmentData) => {
    const localData = dataOverride || commitmentData;
    if (!localData) return;

    setIsInserting(true);
    try {
      await writeContractAsync(
        {
          functionName: "insert",
          args: [BigInt(localData.commitment)],
        },
        {
          blockConfirmations: 1,
          onBlockConfirmation: () => {
            if (leafEvents) {
              const newIndex = leafEvents.length;
              setCommitmentData({ ...localData, index: newIndex });
              setIsInserted(true);
            }
          },
        },
      );
    } catch (error) {
      console.error("Error inserting commitment:", error);
    } finally {
      setIsInserting(false);
    }
  };

  const handleRegister = async () => {
    const data = await handleGenerateCommitment();
    await handleInsertCommitment(data);
  };

  return (
    <div className="bg-base-100 shadow rounded-xl p-6 space-y-5">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-bold">Register for this vote</h2>
        {!compact && (
          <p className="text-sm opacity-70">Generate your anonymous identifier and insert it into the Merkle tree.</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <button
          className={`btn btn-lg ${
            hasRegistered === true
              ? "btn-success cursor-not-allowed"
              : isGenerating || isInserting
                ? "btn-primary"
                : !canRegister
                  ? "btn-disabled"
                  : "btn-primary"
          }`}
          onClick={hasRegistered === true ? undefined : handleRegister}
          disabled={isGenerating || isInserting || !canRegister}
        >
          {isGenerating ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Generating commitment...
            </>
          ) : isInserting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Inserting into Merkle tree...
            </>
          ) : !isConnected ? (
            "Connect wallet to register"
          ) : isVoter === false ? (
            "Not eligible - not on voters list"
          ) : hasRegistered === true ? (
            "✓ Already registered for this vote"
          ) : (
            "Register to vote"
          )}
        </button>
      </div>

      {commitmentData && (
        <div className="space-y-4">
          {compact ? (
            // Compact mode: Only show when inserted
            isInserted && (
              <div className="alert alert-warning">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">Save your nullifier and secret now</h3>
                      {!isAlertCollapsed && (
                        <p className="text-sm opacity-80">
                          These values are required to generate your ZK proof later. They cannot be recovered if lost.
                        </p>
                      )}
                    </div>
                    <button className="btn btn-ghost btn-xs" onClick={() => setIsAlertCollapsed(!isAlertCollapsed)}>
                      {isAlertCollapsed ? "▼" : "▲"}
                    </button>
                  </div>
                  {!isAlertCollapsed && (
                    <div className="flex gap-2">
                      <button
                        className={`btn btn-secondary btn-sm ${isCopiedToClipboard ? "btn-success" : ""}`}
                        onClick={() =>
                          handleCopyJSON({
                            nullifier: commitmentData.nullifier,
                            secret: commitmentData.secret,
                            index: commitmentData.index,
                          })
                        }
                      >
                        {isCopiedToClipboard ? "✓ Copied!" : "Copy JSON"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            // Full mode: Show everything
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">Generated commitment data</h3>
                <div className="flex gap-2">
                  <button
                    className={`btn btn-secondary btn-sm ${isCopiedToClipboard ? "btn-success" : ""}`}
                    onClick={() =>
                      handleCopyJSON({
                        nullifier: commitmentData.nullifier,
                        secret: commitmentData.secret,
                        index: commitmentData.index,
                      })
                    }
                  >
                    {isCopiedToClipboard ? "✓ Copied!" : "Copy JSON"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-base-300 p-3">
                  <div className="text-xs opacity-70 mb-1">Commitment</div>
                  <code className="text-xs break-all bg-base-200 p-2 rounded block">{commitmentData.commitment}</code>
                </div>
                <div className="rounded-lg border border-base-300 p-3">
                  <div className="text-xs opacity-70 mb-1">Nullifier</div>
                  <code className="text-xs break-all bg-base-200 p-2 rounded block">{commitmentData.nullifier}</code>
                </div>
                <div className="rounded-lg border border-base-300 p-3">
                  <div className="text-xs opacity-70 mb-1">Secret</div>
                  <code className="text-xs break-all bg-base-200 p-2 rounded block">{commitmentData.secret}</code>
                </div>
              </div>

              {isInserted && (
                <div className="alert alert-warning">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">Save your nullifier and secret now</h3>
                      {!isAlertCollapsed && (
                        <p className="text-sm opacity-80">
                          These values are required to generate your ZK proof later. They cannot be recovered if lost.
                        </p>
                      )}
                    </div>
                    <button className="btn btn-ghost btn-xs" onClick={() => setIsAlertCollapsed(!isAlertCollapsed)}>
                      {isAlertCollapsed ? "▼" : "▲"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const generateCommitment = async (): Promise<CommitmentData> => {
  // const bb = await Barretenberg.new();
  const nullifier = BigInt(Fr.random().toString());
  const secret = BigInt(Fr.random().toString());

  const commitment = poseidon2([nullifier, secret]);

  // Convert BigInt values to properly formatted bytes32 hex strings
  const commitmentHex = ethers.zeroPadValue(ethers.toBeHex(commitment), 32);
  const nullifierHex = ethers.zeroPadValue(ethers.toBeHex(nullifier), 32);
  const secretHex = ethers.zeroPadValue(ethers.toBeHex(secret), 32);

  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ["bytes32", "bytes32", "bytes32"],
    [commitmentHex, nullifierHex, secretHex],
  );

  return {
    commitment: commitmentHex,
    nullifier: nullifierHex,
    secret: secretHex,
    encoded,
  };
};
