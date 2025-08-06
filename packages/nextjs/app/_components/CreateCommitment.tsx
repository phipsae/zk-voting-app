"use client";

import { useState } from "react";
import { Fr } from "@aztec/bb.js";
import { ethers } from "ethers";
import { poseidon2 } from "poseidon-lite";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface CommitmentData {
  commitment: string;
  nullifier: string;
  secret: string;
  encoded: string;
}

export const CreateCommitment = () => {
  const [commitmentData, setCommitmentData] = useState<CommitmentData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInserting, setIsInserting] = useState(false);

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

  const handleInsertCommitment = async () => {
    if (!commitmentData) return;

    setIsInserting(true);
    try {
      await writeIncrementalMerkleTreeAsync({
        functionName: "insert",
        args: [BigInt(commitmentData.commitment)],
      });
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
        <button className="btn btn-primary btn-lg" onClick={handleGenerateCommitment} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Generating...
            </>
          ) : (
            "Generate Commitment"
          )}
        </button>

        {commitmentData && (
          <button className="btn btn-secondary" onClick={handleInsertCommitment} disabled={isInserting}>
            {isInserting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Inserting...
              </>
            ) : (
              "Insert into Merkle Tree"
            )}
          </button>
        )}
      </div>

      {commitmentData && (
        <div className="w-full max-w-4xl space-y-4">
          <h3 className="text-xl font-semibold">Generated Commitment Data:</h3>

          <button className="btn btn-primary" onClick={() => console.log(BigInt(commitmentData.commitment))}>
            Hello
          </button>

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
              <h4 className="font-semibold text-sm text-gray-600 mb-2">Encoded Data:</h4>
              <code className="text-xs break-all bg-base-300 p-2 rounded block">{commitmentData.encoded}</code>
            </div>
          </div>

          <div className="alert alert-info">
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
            <span>Save your nullifier and secret securely! You&apos;ll need them to generate proofs later.</span>
          </div>
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
