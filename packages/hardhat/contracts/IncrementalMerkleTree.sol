//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {LeanIMT, LeanIMTData} from "@zk-kit/lean-imt.sol/LeanIMT.sol";

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
    string public statement = "How is the vibe?";
    uint256 public yesVotes;
    uint256 public noVotes;

    event NewLeaf(uint256 index, uint256 value);
    event VoteCast(bytes32 indexed nullifierHash, bool vote, uint256 timestamp, uint256 totalYes, uint256 totalNo);

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

    function setStatement(bytes memory _proof, bytes32 _root, bytes32 _nullifierHash, bytes32 _vote, bytes32 _depth)
        public
    {
        if (s_nullifierHashes[_nullifierHash]) {
            revert IncrementalMerkleTree__NullifierHashAlreadyUsed(_nullifierHash);
        }
        s_nullifierHashes[_nullifierHash] = true;

        bytes32[] memory publicInputs = new bytes32[](4);
        publicInputs[0] = _root;
        publicInputs[1] = _nullifierHash;
        publicInputs[2] = _vote;
        publicInputs[3] = _depth;

        if (!i_verifier.verify(_proof, publicInputs)) {
            revert IncrementalMerkleTree__InvalidProof();
        }

        if (_vote == bytes32(uint256(1))) {
            yesVotes++;
        } else {
            noVotes++;
        }

        emit VoteCast(_nullifierHash, _vote == bytes32(uint256(1)), block.timestamp, yesVotes, noVotes);
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
}
