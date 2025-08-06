//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {LeanIMT, LeanIMTData} from "@zk-kit/lean-imt.sol/LeanIMT.sol";
import {PoseidonT3} from "poseidon-solidity/PoseidonT3.sol";
import {PoseidonT2} from "poseidon-solidity/PoseidonT2.sol";

import {IVerifier} from "./Verifier.sol";

contract IncrementalMerkleTree {
    using LeanIMT for LeanIMTData;

    uint256 constant MODULUS = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

    IVerifier public immutable i_verifier;

    // so that not 2 times the same commitment can be inserted
    mapping(uint256 => bool) public s_commitments;
    // so that the proof cannot be replayed - and a person can only vote once
    mapping(bytes32 => bool) public s_nullifierHashes;

    LeanIMTData public tree;
    string public statement = "Ready for the ZK challenge?";

    event NewLeaf(uint256 index, uint256 value);

    error IncrementalMerkleTree__CommitmentAlreadyAdded(uint256 commitment);
    error IncrementalMerkleTree__NullifierHashAlreadyUsed(bytes32 nullifierHash);
    error IncrementalMerkleTree__InvalidProof();

    constructor(IVerifier _verifier) {
        i_verifier = _verifier;
    }

    function insert(uint256 _commitment) public {
        if (s_commitments[_commitment]) {
            revert IncrementalMerkleTree__CommitmentAlreadyAdded(_commitment);
        }
        s_commitments[_commitment] = true;
        tree.insert(_commitment);
        emit NewLeaf(tree.size - 1, _commitment);
    }

    function setStatement(
        bytes memory _proof,
        bytes32 _root,
        bytes32 _nullifierHash,
        bytes32 _statement,
        bytes32 _depth,
        string memory _originalStatement
    ) public {
        if (s_nullifierHashes[_nullifierHash]) {
            revert IncrementalMerkleTree__NullifierHashAlreadyUsed(_nullifierHash);
        }
        s_nullifierHashes[_nullifierHash] = true;

        // Verify that the provided original statement matches the hash in the proof
        bytes32 expectedStatementHash = bytes32(uint256(keccak256(abi.encodePacked(_originalStatement))) % MODULUS);
        if (_statement != expectedStatementHash) {
            revert IncrementalMerkleTree__InvalidProof();
        }

        bytes32[] memory publicInputs = new bytes32[](4);
        publicInputs[0] = _root;
        publicInputs[1] = _nullifierHash;
        publicInputs[2] = _statement; // This is the hash
        publicInputs[3] = _depth;

        if (!i_verifier.verify(_proof, publicInputs)) {
            revert IncrementalMerkleTree__InvalidProof();
        }

        statement = _originalStatement; // Store the original readable statement
    }

    // getters

    function getLeaf(uint256 index) public view returns (uint256) {
        return tree.leaves[index];
    }

    function getNode(uint256 index) public view returns (uint256) {
        return tree.sideNodes[index];
    }

    function getSize() public view returns (uint256) {
        return tree.size;
    }

    function getDepth() public view returns (uint256) {
        return tree.depth;
    }

    function getRoot() public view returns (uint256) {
        return tree.root();
    }

    function calculatePoseidonHash(uint256 left, uint256 right) public pure returns (uint256) {
        return PoseidonT3.hash([left, right]);
    }

    function stringToBytes32(string memory source) public pure returns (bytes32 result) {
        bytes memory temp = bytes(source);
        if (temp.length == 0) {
            return 0x0;
        }

        // Truncate if longer than 32 bytes
        assembly {
            result := mload(add(source, 32))
        }
    }

    function bytes32ToString(bytes32 _bytes32) public pure returns (string memory) {
        uint8 i = 0;
        while (i < 32 && _bytes32[i] != 0) {
            i++;
        }

        bytes memory bytesArray = new bytes(i);
        for (uint8 j = 0; j < i; j++) {
            bytesArray[j] = _bytes32[j];
        }

        return string(bytesArray);
    }
}
