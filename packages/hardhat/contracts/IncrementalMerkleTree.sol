//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {LeanIMT, LeanIMTData} from "@zk-kit/lean-imt.sol/LeanIMT.sol";
import {PoseidonT3} from "poseidon-solidity/PoseidonT3.sol";
import {IVerifier} from "./Verifier.sol";

contract IncrementalMerkleTree {
    using LeanIMT for LeanIMTData;

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
        string memory _statement,
        bytes32 _depth
    ) public {
        if (s_nullifierHashes[_nullifierHash]) {
            revert IncrementalMerkleTree__NullifierHashAlreadyUsed(_nullifierHash);
        }
        s_nullifierHashes[_nullifierHash] = true;

        bytes32[] memory publicInputs = new bytes32[](3);
        publicInputs[0] = _root;
        publicInputs[1] = _nullifierHash;
        // Convert string to bytes32 by taking the first 32 bytes of the string's bytes representation
        bytes32 statementBytes32;
        assembly {
            statementBytes32 := mload(add(_statement, 32))
        }
        publicInputs[2] = statementBytes32;
        publicInputs[3] = _depth;

        if (!i_verifier.verify(_proof, publicInputs)) {
            revert IncrementalMerkleTree__InvalidProof();
        }

        statement = _statement;
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

    function calculatePoseidonHash(uint256 left, uint256 right) public pure returns (uint256) {
        return PoseidonT3.hash([left, right]);
    }
}
