"use client";

import { useCallback } from "react";
import { useAccount } from "wagmi";
import {
  clearCommitmentFromLocalStorage,
  clearProofFromLocalStorage,
  getStoredCommitmentMetadata,
  getStoredProofMetadata,
} from "~~/utils/scaffold-eth";

interface LogLocalStorageProps {
  contractAddress?: `0x${string}`;
}

export const LogLocalStorage = ({ contractAddress }: LogLocalStorageProps) => {
  const { address: userAddress } = useAccount();

  const handleLog = useCallback(() => {
    try {
      const commitment = getStoredCommitmentMetadata(contractAddress, userAddress);
      const proof = getStoredProofMetadata(contractAddress, userAddress);
      // Grouped console output for readability

      console.groupCollapsed(`LocalStorage for ${contractAddress ?? "<no-contract>"} / ${userAddress ?? "<no-user>"}`);

      console.log({ commitment, proof });

      console.groupEnd();
    } catch (error) {
      console.error("Failed to read localStorage:", error);
    }
  }, [contractAddress, userAddress]);

  const handleClear = useCallback(() => {
    try {
      clearCommitmentFromLocalStorage(contractAddress, userAddress);
      clearProofFromLocalStorage(contractAddress, userAddress);

      console.info("Cleared stored commitment and proof for this contract/user.");
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
  }, [contractAddress, userAddress]);

  return (
    <div className="flex gap-2">
      <button className="btn btn-outline btn-sm" onClick={handleLog}>
        Log localStorage
      </button>
      <button className="btn btn-ghost btn-sm" onClick={handleClear}>
        Clear
      </button>
    </div>
  );
};

export default LogLocalStorage;
