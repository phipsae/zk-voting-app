import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

/**
 * @example
 * const externalContracts = {
 *   1: {
 *     DAI: {
 *       address: "0x...",
 *       abi: [...],
 *     },
 *   },
 * } as const;
 */
const externalContracts = {
  84532: {
    HonkVerifier: {
      address: "0x57275b39250dB7cf77F98Afb532fE3eA421a43B3",
      abi: [
        {
          inputs: [],
          name: "ProofLengthWrong",
          type: "error",
        },
        {
          inputs: [],
          name: "PublicInputsLengthWrong",
          type: "error",
        },
        {
          inputs: [],
          name: "ShpleminiFailed",
          type: "error",
        },
        {
          inputs: [],
          name: "SumcheckFailed",
          type: "error",
        },
        {
          inputs: [
            {
              internalType: "bytes",
              name: "proof",
              type: "bytes",
            },
            {
              internalType: "bytes32[]",
              name: "publicInputs",
              type: "bytes32[]",
            },
          ],
          name: "verify",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
      inheritedFunctions: {},
      deployedOnBlock: 29619283,
    },
    IncrementalMerkleTree: {
      address: "0x584d85D63Bc918721198078538DB3648d2f62275",
      abi: [
        {
          inputs: [
            {
              internalType: "contract IVerifier",
              name: "_verifier",
              type: "address",
            },
          ],
          stateMutability: "nonpayable",
          type: "constructor",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "commitment",
              type: "uint256",
            },
          ],
          name: "IncrementalMerkleTree__CommitmentAlreadyAdded",
          type: "error",
        },
        {
          inputs: [],
          name: "IncrementalMerkleTree__InvalidProof",
          type: "error",
        },
        {
          inputs: [
            {
              internalType: "bytes32",
              name: "nullifierHash",
              type: "bytes32",
            },
          ],
          name: "IncrementalMerkleTree__NullifierHashAlreadyUsed",
          type: "error",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "uint256",
              name: "index",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "value",
              type: "uint256",
            },
          ],
          name: "NewLeaf",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "bytes32",
              name: "nullifierHash",
              type: "bytes32",
            },
            {
              indexed: true,
              internalType: "address",
              name: "voter",
              type: "address",
            },
            {
              indexed: false,
              internalType: "bool",
              name: "vote",
              type: "bool",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "timestamp",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "totalYes",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "totalNo",
              type: "uint256",
            },
          ],
          name: "VoteCast",
          type: "event",
        },
        {
          inputs: [],
          name: "getDepth",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "index",
              type: "uint256",
            },
          ],
          name: "getLeaf",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "index",
              type: "uint256",
            },
          ],
          name: "getNode",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getRoot",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getSize",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "i_verifier",
          outputs: [
            {
              internalType: "contract IVerifier",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "_commitment",
              type: "uint256",
            },
          ],
          name: "insert",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [],
          name: "noVotes",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "question",
          outputs: [
            {
              internalType: "string",
              name: "",
              type: "string",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          name: "s_commitments",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "bytes32",
              name: "",
              type: "bytes32",
            },
          ],
          name: "s_nullifierHashes",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "tree",
          outputs: [
            {
              internalType: "uint256",
              name: "size",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "depth",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "bytes",
              name: "_proof",
              type: "bytes",
            },
            {
              internalType: "bytes32",
              name: "_root",
              type: "bytes32",
            },
            {
              internalType: "bytes32",
              name: "_nullifierHash",
              type: "bytes32",
            },
            {
              internalType: "bytes32",
              name: "_vote",
              type: "bytes32",
            },
            {
              internalType: "bytes32",
              name: "_depth",
              type: "bytes32",
            },
          ],
          name: "vote",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [],
          name: "yesVotes",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
      inheritedFunctions: {},
      deployedOnBlock: 29619373,
    },
    LeanIMT: {
      address: "0xcF4ac52079F69C93904e2A4a379cAd1F0C8dA0A9",
      abi: [
        {
          inputs: [],
          name: "LeafAlreadyExists",
          type: "error",
        },
        {
          inputs: [],
          name: "LeafCannotBeZero",
          type: "error",
        },
        {
          inputs: [],
          name: "LeafDoesNotExist",
          type: "error",
        },
        {
          inputs: [],
          name: "LeafGreaterThanSnarkScalarField",
          type: "error",
        },
        {
          inputs: [],
          name: "WrongSiblingNodes",
          type: "error",
        },
      ],
      inheritedFunctions: {},
      deployedOnBlock: 29619346,
    },
    PoseidonT3: {
      address: "0x8b698d8f63f078369C067d58A4CC4B529F219CF7",
      abi: [
        {
          inputs: [
            {
              internalType: "uint256[2]",
              name: "",
              type: "uint256[2]",
            },
          ],
          name: "hash",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "pure",
          type: "function",
        },
      ],
      inheritedFunctions: {},
      deployedOnBlock: 29619310,
    },
  },
} as const;

export default externalContracts satisfies GenericContractsDeclaration;
