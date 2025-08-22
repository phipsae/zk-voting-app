/**
 * Utility functions for storing and retrieving proof data from localStorage
 */

export interface SerializableProofData {
  proof: number[]; // Uint8Array serialized as number array
  publicInputs: any[];
  timestamp: number;
  contractAddress?: string;
  voteChoice?: boolean;
}

const PROOF_STORAGE_KEY_PREFIX = "zk-voting-proof-data";

/**
 * Generate contract-specific storage key
 */
const getStorageKey = (contractAddress?: string): string => {
  if (!contractAddress) {
    return `${PROOF_STORAGE_KEY_PREFIX}-default`;
  }
  return `${PROOF_STORAGE_KEY_PREFIX}-${contractAddress.toLowerCase()}`;
};

/**
 * Convert ProofData to a serializable format for localStorage
 */
export const serializeProofData = (
  proofData: { proof: Uint8Array; publicInputs: any[] },
  contractAddress?: string,
  voteChoice?: boolean,
): SerializableProofData => {
  return {
    proof: Array.from(proofData.proof), // Convert Uint8Array to number array
    publicInputs: proofData.publicInputs,
    timestamp: Date.now(),
    contractAddress,
    voteChoice,
  };
};

/**
 * Convert serialized data back to ProofData format
 */
export const deserializeProofData = (
  serializedData: SerializableProofData,
): { proof: Uint8Array; publicInputs: any[] } => {
  return {
    proof: new Uint8Array(serializedData.proof), // Convert number array back to Uint8Array
    publicInputs: serializedData.publicInputs,
  };
};

/**
 * Save proof data to localStorage
 */
export const saveProofToLocalStorage = (
  proofData: { proof: Uint8Array; publicInputs: any[] },
  contractAddress?: string,
  voteChoice?: boolean,
): void => {
  try {
    const serialized = serializeProofData(proofData, contractAddress, voteChoice);
    const storageKey = getStorageKey(contractAddress);
    localStorage.setItem(storageKey, JSON.stringify(serialized));
    console.log(`Proof data saved to localStorage for contract: ${contractAddress}`);
  } catch (error) {
    console.error("Failed to save proof data to localStorage:", error);
  }
};

/**
 * Load proof data from localStorage
 */
export const loadProofFromLocalStorage = (
  contractAddress?: string,
): { proof: Uint8Array; publicInputs: any[] } | null => {
  try {
    const storageKey = getStorageKey(contractAddress);
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;

    const serialized: SerializableProofData = JSON.parse(stored);
    return deserializeProofData(serialized);
  } catch (error) {
    console.error("Failed to load proof data from localStorage:", error);
    return null;
  }
};

/**
 * Get full serialized proof data with metadata from localStorage
 */
export const getStoredProofMetadata = (contractAddress?: string): SerializableProofData | null => {
  try {
    const storageKey = getStorageKey(contractAddress);
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to get stored proof metadata:", error);
    return null;
  }
};

/**
 * Clear proof data from localStorage
 */
export const clearProofFromLocalStorage = (contractAddress?: string): void => {
  try {
    const storageKey = getStorageKey(contractAddress);
    localStorage.removeItem(storageKey);
    console.log(`Proof data cleared from localStorage for contract: ${contractAddress}`);
  } catch (error) {
    console.error("Failed to clear proof data from localStorage:", error);
  }
};

/**
 * Check if proof data exists in localStorage
 */
export const hasStoredProof = (contractAddress?: string): boolean => {
  try {
    const storageKey = getStorageKey(contractAddress);
    return localStorage.getItem(storageKey) !== null;
  } catch {
    return false;
  }
};
