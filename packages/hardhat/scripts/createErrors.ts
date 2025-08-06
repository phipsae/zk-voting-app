import { keccak256, toUtf8Bytes } from "ethers";

const errors = [
  "ProofLengthWrong()",
  "PublicInputsLengthWrong()",
  "ShpleminiFailed()",
  "SumcheckFailed()",
  "IncrementalMerkleTree__CommitmentAlreadyAdded(uint256)",
  "IncrementalMerkleTree__InvalidProof()",
  "IncrementalMerkleTree__NullifierHashAlreadyUsed(bytes32)",
];

errors.forEach(error => {
  const hash = keccak256(toUtf8Bytes(error));
  const signature = hash.slice(0, 10); // First 4 bytes (8 hex characters + '0x')
  console.log(`${error}: ${signature}`);
});

// Test what the string '1' becomes when converted to bytes32 like the contract does
// const testString = "1";
// const abiCoder = ethers.AbiCoder.defaultAbiCoder();

// // This mimics what the assembly does: mload(add(_statement, 32))
// const encoded = abiCoder.encode(["string"], [testString]);
// console.log('Encoded string \"1\":', encoded);

// // The bytes of the string '1'
// const stringBytes = ethers.toUtf8Bytes(testString);
// console.log('UTF8 bytes of \"1\":', ethers.hexlify(stringBytes));

// // Pad to 32 bytes (what assembly does)
// const padded = ethers.hexlify(stringBytes).padEnd(66, "0"); // 66 = 2 + 64 hex chars
// console.log("Padded to 32 bytes:", padded);

// // What we actually want (numeric 1 as bytes32)
// const numericOne = ethers.toBeHex(1, 32);
// console.log("Numeric 1 as bytes32:", numericOne);
