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
const VOTE_STORAGE_KEY_PREFIX = "zk-voting-vote-data";
const NESTED_STORAGE_KEY = "zk-voting-index"; // contractAddress -> userAddress -> { commitment, proof }

export interface NestedUserData {
  commitment?: SerializableCommitmentData;
  proof?: SerializableProofData;
  vote?: VoteRecord;
}

export interface VoteRecord {
  voteChoice: boolean;
  txHash: string;
  timestamp: number;
  contractAddress?: string;
  userAddress?: string;
  smartAccountAddress?: string;
  burnerAddress?: string;
  status?: "pending" | "success" | "failed";
  blockNumber?: string;
  error?: string;
}

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

const getVoteStorageKey = (contractAddress?: string, userAddress?: string): string =>
  buildStorageKey(VOTE_STORAGE_KEY_PREFIX, contractAddress, userAddress);

const setJSON = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));
const getJSON = <T>(key: string): T | null => {
  const stored = localStorage.getItem(key);
  return stored ? (JSON.parse(stored) as T) : null;
};

/**
 * Nested index helpers: contractAddress -> userAddress -> { commitment, proof }
 */
const normalizeAddress = (address?: string) => address?.toLowerCase();

type NestedIndex = Record<string, Record<string, NestedUserData>>;

const getNestedIndex = (): NestedIndex => {
  try {
    return getJSON<NestedIndex>(NESTED_STORAGE_KEY) ?? {};
  } catch {
    return {};
  }
};

const setNestedIndex = (index: NestedIndex) => {
  try {
    setJSON(NESTED_STORAGE_KEY, index);
  } catch (error) {
    console.error("Failed to update nested index in localStorage:", error);
  }
};

const upsertNestedUserData = (contractAddress?: string, userAddress?: string, data?: Partial<NestedUserData>) => {
  const c = normalizeAddress(contractAddress);
  const u = normalizeAddress(userAddress);
  if (!c || !u || !data) return;
  const index = getNestedIndex();
  index[c] = index[c] || {};
  index[c][u] = { ...(index[c][u] || {}), ...data };
  setNestedIndex(index);
};

const removeNestedField = (contractAddress?: string, userAddress?: string, field?: "commitment" | "proof" | "vote") => {
  const c = normalizeAddress(contractAddress);
  const u = normalizeAddress(userAddress);
  if (!c || !u || !field) return;
  const index = getNestedIndex();
  if (!index[c] || !index[c][u]) return;
  delete (index[c][u] as any)[field];
  if (!index[c][u].commitment && !index[c][u].proof && !index[c][u].vote) {
    delete index[c][u];
  }
  if (index[c] && Object.keys(index[c]).length === 0) {
    delete index[c];
  }
  setNestedIndex(index);
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
    // Also update nested index under contract -> user -> proof
    upsertNestedUserData(contractAddress, userAddress, { proof: serialized });
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
    removeNestedField(contractAddress, userAddress, "proof");
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
 * Save vote record to localStorage
 */
export const saveVoteToLocalStorage = (
  voteChoice: boolean,
  txHash: string,
  contractAddress?: string,
  userAddress?: string,
  smartAccountAddress?: string,
  burnerAddress?: string,
  status?: "pending" | "success" | "failed",
): void => {
  try {
    const record: VoteRecord = {
      voteChoice,
      txHash,
      timestamp: Date.now(),
      contractAddress,
      userAddress,
      smartAccountAddress,
      burnerAddress,
      status,
    };
    const storageKey = getVoteStorageKey(contractAddress, userAddress);
    setJSON(storageKey, record);
    upsertNestedUserData(contractAddress, userAddress, { vote: record });
  } catch (error) {
    console.error("Failed to save vote record to localStorage:", error);
  }
};

export const updateVoteInLocalStorage = (
  contractAddress?: string,
  userAddress?: string,
  updates?: Partial<VoteRecord>,
): void => {
  try {
    const storageKey = getVoteStorageKey(contractAddress, userAddress);
    const current = getJSON<VoteRecord>(storageKey) || ({} as VoteRecord);
    const merged: VoteRecord = { ...current, ...updates } as VoteRecord;
    setJSON(storageKey, merged);
    upsertNestedUserData(contractAddress, userAddress, { vote: merged });
  } catch (error) {
    console.error("Failed to update vote record in localStorage:", error);
  }
};

export const getStoredVoteMetadata = (contractAddress?: string, userAddress?: string): VoteRecord | null => {
  try {
    const storageKey = getVoteStorageKey(contractAddress, userAddress);
    return getJSON<VoteRecord>(storageKey);
  } catch (error) {
    console.error("Failed to get stored vote metadata:", error);
    return null;
  }
};

export const clearVoteFromLocalStorage = (contractAddress?: string, userAddress?: string): void => {
  try {
    const storageKey = getVoteStorageKey(contractAddress, userAddress);
    localStorage.removeItem(storageKey);
    removeNestedField(contractAddress, userAddress, "vote");
  } catch (error) {
    console.error("Failed to clear vote from localStorage:", error);
  }
};

export const hasStoredVote = (contractAddress?: string, userAddress?: string): boolean => {
  try {
    const storageKey = getVoteStorageKey(contractAddress, userAddress);
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
    // Also update nested index under contract -> user -> commitment
    upsertNestedUserData(contractAddress, userAddress, { commitment: serialized });
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
    removeNestedField(contractAddress, userAddress, "commitment");
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
