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
      address: "0x471b0784517899d8465Ad7a1a31d238F8F95B6c9",
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
      deployedOnBlock: 29581086,
    },
    IncrementalMerkleTree: {
      address: "0x55E513E0D71445B08E429D463DBD2571f1dE837A",
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
      deployedOnBlock: 29581090,
    },
    LeanIMT: {
      address: "0x3212E6A22B8C018fc78204D185fF8bD715Ab0FFB",
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
      deployedOnBlock: 29581087,
    },
    PoseidonT3: {
      address: "0x12961542E5Aa59541F2a7bFeF3F504A406AfC946",
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
      deployedOnBlock: 29581085,
    },
  },
} as const;

export default externalContracts satisfies GenericContractsDeclaration;
