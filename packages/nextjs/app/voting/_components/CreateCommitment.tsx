"use client";

import { useState } from "react";
import { Fr } from "@aztec/bb.js";
import { ethers } from "ethers";
import { poseidon2 } from "poseidon-lite";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";

interface CommitmentData {
  commitment: string;
  nullifier: string;
  secret: string;
  encoded: string;
}

interface CreateCommitmentProps {
  leafEvents?: any[];
  contractAddress?: `0x${string}`;
}

export const CreateCommitment = ({ leafEvents = [] }: CreateCommitmentProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [isInserted, setIsInserted] = useState(false);
  const { setCommitmentData, commitmentData } = useGlobalState();

  const { writeContractAsync: writeVotingAsync } = useScaffoldWriteContract({
    contractName: "Voting",
  });

  const handleGenerateCommitment = async () => {
    setIsGenerating(true);
    try {
      const data = await generateCommitment();
      setCommitmentData(data);
    } catch (error) {
      console.error("Error generating commitment:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (data: any) => {
    const jsonStr = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonStr);
  };

  const handleInsertCommitment = async () => {
    if (!commitmentData) return;

    setIsInserting(true);
    try {
      await writeVotingAsync({
        functionName: "insert",
        args: [BigInt(commitmentData.commitment)],
        // Note: the SE2 write hook does not allow overriding address directly; for dynamic address we would
        // need a custom viem write. For now we assume default network mapping is set to the right Voting when
        // using this component on the default page. The dynamic voting page will send the tx via burner/paymaster.
      });

      // Update commitment data with the index (it will be the latest leaf)
      // TODO: maybe check directly merkletree size
      if (leafEvents) {
        const newIndex = leafEvents.length;
        setCommitmentData({ ...commitmentData, index: newIndex });
        setIsInserted(true);
      }
    } catch (error) {
      console.error("Error inserting commitment:", error);
    } finally {
      setIsInserting(false);
    }
  };

  return (
    <div className="bg-base-100 shadow rounded-xl p-6 space-y-5">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">Step 1 — Register & insert commitment</h2>
        <p className="text-sm opacity-70">Generate your anonymous identifier and insert it into the Merkle tree.</p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          className="btn btn-primary btn-lg"
          onClick={async () => {
            await handleGenerateCommitment();
            if (commitmentData) {
              await handleInsertCommitment();
            }
          }}
          disabled={isGenerating || isInserting}
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
          ) : (
            "Generate & insert commitment"
          )}
        </button>
        <p className="text-xs opacity-70">This action will request a transaction to store your commitment on-chain.</p>
      </div>

      {commitmentData && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Generated commitment data</h3>
            <div className="flex gap-2">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  copyToClipboard({
                    nullifier: commitmentData.nullifier,
                    secret: commitmentData.secret,
                    index: commitmentData.index,
                  })
                }
              >
                Copy JSON
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => copyToClipboard(commitmentData.commitment)}>
                Copy commitment
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
              <div>
                <h3 className="font-semibold">Save your nullifier and secret now</h3>
                <p className="text-sm opacity-80">
                  These values are required to generate your ZK proof later. They cannot be recovered if lost.
                </p>
              </div>
            </div>
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
