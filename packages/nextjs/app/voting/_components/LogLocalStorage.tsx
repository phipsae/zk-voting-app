"use client";

import { useCallback } from "react";
import { useAccount } from "wagmi";
import { getStoredCommitmentMetadata, getStoredProofMetadata, getStoredVoteMetadata } from "~~/utils/scaffold-eth";

interface LogLocalStorageProps {
  contractAddress?: `0x${string}`;
}

export const LogLocalStorage = ({ contractAddress }: LogLocalStorageProps) => {
  const { address: userAddress } = useAccount();

  const handleLog = useCallback(() => {
    try {
      const commitment = getStoredCommitmentMetadata(contractAddress, userAddress);
      const proof = getStoredProofMetadata(contractAddress, userAddress);
      const vote = getStoredVoteMetadata(contractAddress, userAddress);
      // Grouped console output for readability

      console.groupCollapsed(`LocalStorage for ${contractAddress ?? "<no-contract>"} / ${userAddress ?? "<no-user>"}`);

      console.log({ commitment, proof, vote });

      console.groupEnd();
    } catch (error) {
      console.error("Failed to read localStorage:", error);
    }
  }, [contractAddress, userAddress]);

  return (
    <div className="flex gap-2">
      <button className="btn btn-outline btn-sm" onClick={handleLog}>
        Log localStorage
      </button>
    </div>
  );
};

export default LogLocalStorage;
