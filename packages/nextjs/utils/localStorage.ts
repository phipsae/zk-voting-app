/**
 * Utility functions for storing and retrieving proof data and commitment data from localStorage
 */

export interface SerializableProofData {
  proof: number[]; // Uint8Array serialized as number array
  publicInputs: any[];
  timestamp: number;
  contractAddress?: string;
  voteChoice?: boolean;
}

export interface CommitmentData {
  commitment: string;
  nullifier: string;
  secret: string;
  encoded: string;
  index?: number;
}

export interface SerializableCommitmentData extends CommitmentData {
  timestamp: number;
  contractAddress?: string;
  userAddress?: string;
}

const PROOF_STORAGE_KEY_PREFIX = "zk-voting-proof-data";
const COMMITMENT_STORAGE_KEY_PREFIX = "zk-voting-commitment-data";

/**
 * Internal helpers to reduce duplication
 */
const buildStorageKey = (prefix: string, contractAddress?: string, userAddress?: string): string => {
  const c = contractAddress?.toLowerCase();
  const u = userAddress?.toLowerCase();
  if (!c && !u) return `${prefix}-default`;
  if (!c) return `${prefix}-${u || "default"}`;
  if (!u) return `${prefix}-${c}`;
  return `${prefix}-${c}-${u}`;
};

const getStorageKey = (contractAddress?: string, userAddress?: string): string =>
  buildStorageKey(PROOF_STORAGE_KEY_PREFIX, contractAddress, userAddress);

const getCommitmentStorageKey = (contractAddress?: string, userAddress?: string): string =>
  buildStorageKey(COMMITMENT_STORAGE_KEY_PREFIX, contractAddress, userAddress);

const setJSON = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));
const getJSON = <T>(key: string): T | null => {
  const stored = localStorage.getItem(key);
  return stored ? (JSON.parse(stored) as T) : null;
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
  userAddress?: string,
): void => {
  try {
    const serialized = serializeProofData(proofData, contractAddress, voteChoice);
    const storageKey = getStorageKey(contractAddress, userAddress);
    setJSON(storageKey, serialized);
  } catch (error) {
    console.error("Failed to save proof data to localStorage:", error);
  }
};

/**
 * Load proof data from localStorage
 */
export const loadProofFromLocalStorage = (
  contractAddress?: string,
  userAddress?: string,
): { proof: Uint8Array; publicInputs: any[] } | null => {
  try {
    const storageKey = getStorageKey(contractAddress, userAddress);
    const serialized = getJSON<SerializableProofData>(storageKey);
    if (!serialized) return null;
    return deserializeProofData(serialized);
  } catch (error) {
    console.error("Failed to load proof data from localStorage:", error);
    return null;
  }
};

/**
 * Get full serialized proof data with metadata from localStorage
 */
export const getStoredProofMetadata = (
  contractAddress?: string,
  userAddress?: string,
): SerializableProofData | null => {
  try {
    const storageKey = getStorageKey(contractAddress, userAddress);
    return getJSON<SerializableProofData>(storageKey);
  } catch (error) {
    console.error("Failed to get stored proof metadata:", error);
    return null;
  }
};

/**
 * Clear proof data from localStorage
 */
export const clearProofFromLocalStorage = (contractAddress?: string, userAddress?: string): void => {
  try {
    const storageKey = getStorageKey(contractAddress, userAddress);
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Failed to clear proof data from localStorage:", error);
  }
};

/**
 * Check if proof data exists in localStorage
 */
export const hasStoredProof = (contractAddress?: string, userAddress?: string): boolean => {
  try {
    const storageKey = getStorageKey(contractAddress, userAddress);
    return localStorage.getItem(storageKey) !== null;
  } catch {
    return false;
  }
};

/**
 * Save commitment data to localStorage
 */
export const saveCommitmentToLocalStorage = (
  commitmentData: CommitmentData,
  contractAddress?: string,
  userAddress?: string,
): void => {
  try {
    const serialized: SerializableCommitmentData = {
      ...commitmentData,
      timestamp: Date.now(),
      contractAddress,
      userAddress,
    };
    const storageKey = getCommitmentStorageKey(contractAddress, userAddress);
    setJSON(storageKey, serialized);
  } catch (error) {
    console.error("Failed to save commitment data to localStorage:", error);
  }
};

/**
 * Load commitment data from localStorage
 */
export const loadCommitmentFromLocalStorage = (
  contractAddress?: string,
  userAddress?: string,
): CommitmentData | null => {
  try {
    const storageKey = getCommitmentStorageKey(contractAddress, userAddress);
    const serialized = getJSON<SerializableCommitmentData>(storageKey);
    if (!serialized) return null;
    // Return only the commitment data without metadata
    const { commitment, nullifier, secret, encoded, index } = serialized;
    return { commitment, nullifier, secret, encoded, index };
  } catch (error) {
    console.error("Failed to load commitment data from localStorage:", error);
    return null;
  }
};

/**
 * Get full serialized commitment data with metadata from localStorage
 */
export const getStoredCommitmentMetadata = (
  contractAddress?: string,
  userAddress?: string,
): SerializableCommitmentData | null => {
  try {
    const storageKey = getCommitmentStorageKey(contractAddress, userAddress);
    return getJSON<SerializableCommitmentData>(storageKey);
  } catch (error) {
    console.error("Failed to get stored commitment metadata:", error);
    return null;
  }
};

/**
 * Clear commitment data from localStorage
 */
export const clearCommitmentFromLocalStorage = (contractAddress?: string, userAddress?: string): void => {
  try {
    const storageKey = getCommitmentStorageKey(contractAddress, userAddress);
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Failed to clear commitment data from localStorage:", error);
  }
};

/**
 * Check if commitment data exists in localStorage
 */
export const hasStoredCommitment = (contractAddress?: string, userAddress?: string): boolean => {
  try {
    const storageKey = getCommitmentStorageKey(contractAddress, userAddress);
    return localStorage.getItem(storageKey) !== null;
  } catch {
    return false;
  }
};
