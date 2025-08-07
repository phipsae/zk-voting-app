"use client";

import { useState } from "react";
import { Fr } from "@aztec/bb.js";
import { ethers } from "ethers";
import { poseidon2 } from "poseidon-lite";
import { useScaffoldEventHistory, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";

interface CommitmentData {
  commitment: string;
  nullifier: string;
  secret: string;
  encoded: string;
}

export const CreateCommitment = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [isInserted, setIsInserted] = useState(false);
  const { setCommitmentData, commitmentData } = useGlobalState();

  const { data: leafEvents } = useScaffoldEventHistory({
    contractName: "IncrementalMerkleTree",
    eventName: "NewLeaf",
    fromBlock: 0n,
    watch: true,
  });

  const { writeContractAsync: writeIncrementalMerkleTreeAsync } = useScaffoldWriteContract({
    contractName: "IncrementalMerkleTree",
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
      await writeIncrementalMerkleTreeAsync({
        functionName: "insert",
        args: [BigInt(commitmentData.commitment)],
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
    <div className="flex flex-col items-center space-y-6 p-6 bg-base-100 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center">ZK Commitment Generator</h2>

      <div className="flex flex-col space-y-4">
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
              Generating Commitment...
            </>
          ) : isInserting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Inserting into Merkle Tree...
            </>
          ) : (
            "Generate & Insert Commitment"
          )}
        </button>
      </div>

      {commitmentData && (
        <div className="w-full max-w-4xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Generated Commitment Data:</h3>
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
              Copy Proof Data
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-base-200 p-4 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-600 mb-2">Commitment:</h4>
              <code className="text-xs break-all bg-base-300 p-2 rounded block">{commitmentData.commitment}</code>
            </div>

            <div className="bg-base-200 p-4 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-600 mb-2">Nullifier:</h4>
              <code className="text-xs break-all bg-base-300 p-2 rounded block">{commitmentData.nullifier}</code>
            </div>

            <div className="bg-base-200 p-4 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-600 mb-2">Secret:</h4>
              <code className="text-xs break-all bg-base-300 p-2 rounded block">{commitmentData.secret}</code>
            </div>

            <div className="bg-base-200 p-4 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-600 mb-2">Index:</h4>
              <code className="text-xs break-all bg-base-300 p-2 rounded block">
                {commitmentData.index ?? "Not inserted yet"}
              </code>
            </div>

            <div className="bg-base-200 p-4 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-600 mb-2">Encoded Data:</h4>
              <code className="text-xs break-all bg-base-300 p-2 rounded block">{commitmentData.encoded}</code>
            </div>
          </div>

          {isInserted && (
            <div className="alert alert-error shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex flex-col">
                <h3 className="text-lg font-bold">🚨 IMPORTANT: Save Your Data NOW! 🚨</h3>
                <p>
                  Make sure you have copied and securely stored your nullifier and secret values before leaving this
                  page. These values are NOT recoverable and are REQUIRED for future proof generation!
                </p>
                <p className="mt-2 font-bold">
                  ⚠️ Without these values, you will lose access to your commitment permanently! ⚠️
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
