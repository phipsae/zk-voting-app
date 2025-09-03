//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {LeanIMT, LeanIMTData} from "@zk-kit/lean-imt.sol/LeanIMT.sol";

import {IVerifier} from "./Verifier.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Voting is Ownable {
    using LeanIMT for LeanIMTData;

    uint256 constant MODULUS = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

    IVerifier public immutable i_verifier;
    string public s_question;
    uint256 public immutable i_registrationDeadline;

    // so that not 2 times the same commitment can be inserted
    mapping(uint256 => bool) public s_commitments;
    // so that the proof cannot be replayed - and a person can only vote once
    mapping(bytes32 => bool) public s_nullifierHashes;
    mapping(address => bool) private s_voters;
    mapping(address => bool) private s_hasRegistered;

    LeanIMTData public s_tree;
    uint256 public s_yesVotes;
    uint256 public s_noVotes;

    event NewLeaf(uint256 index, uint256 value);
    event VoteCast(
        bytes32 indexed nullifierHash,
        address indexed voter,
        bool vote,
        uint256 timestamp,
        uint256 totalYes,
        uint256 totalNo
    );
    event VoterAdded(address indexed voter);

    error Voting__CommitmentAlreadyAdded(uint256 commitment);
    error Voting__NullifierHashAlreadyUsed(bytes32 nullifierHash);
    error Voting__InvalidProof();
    error Voting__NotAllowedToVote();
    error Voting__VotersLengthMismatch();
    error Voting__RegistrationPeriodNotOver();
    error Voting__RegistrationPeriodOver();

    constructor(IVerifier _verifier, string memory _question, uint256 _registrationDuration) Ownable(msg.sender) {
        i_verifier = _verifier;
        s_question = _question;
        i_registrationDeadline = _registrationDuration + block.timestamp;
    }

    function addVoters(address[] calldata voters, bool[] calldata statuses) public onlyOwner {
        if (block.timestamp > i_registrationDeadline) {
            revert Voting__RegistrationPeriodOver();
        }
        if (voters.length != statuses.length) {
            revert Voting__VotersLengthMismatch();
        }

        for (uint256 i = 0; i < voters.length; i++) {
            s_voters[voters[i]] = statuses[i];
            emit VoterAdded(voters[i]);
        }
    }

    function insert(uint256 _commitment) public {
        if (block.timestamp > i_registrationDeadline) {
            revert Voting__RegistrationPeriodOver();
        }
        if (!s_voters[msg.sender] || s_hasRegistered[msg.sender]) {
            revert Voting__NotAllowedToVote();
        }
        if (s_commitments[_commitment]) {
            revert Voting__CommitmentAlreadyAdded(_commitment);
        }
        s_commitments[_commitment] = true;
        s_hasRegistered[msg.sender] = true;
        s_tree.insert(_commitment);
        emit NewLeaf(s_tree.size - 1, _commitment);
    }

    // TODO: change to vote
    function vote(bytes memory _proof, bytes32 _root, bytes32 _nullifierHash, bytes32 _vote, bytes32 _depth) public {
        if (block.timestamp <= i_registrationDeadline) {
            revert Voting__RegistrationPeriodNotOver();
        }
        if (s_nullifierHashes[_nullifierHash]) {
            revert Voting__NullifierHashAlreadyUsed(_nullifierHash);
        }
        s_nullifierHashes[_nullifierHash] = true;

        bytes32[] memory publicInputs = new bytes32[](4);
        publicInputs[0] = _root;
        publicInputs[1] = _nullifierHash;
        publicInputs[2] = _vote;
        publicInputs[3] = _depth;

        if (!i_verifier.verify(_proof, publicInputs)) {
            revert Voting__InvalidProof();
        }

        if (_vote == bytes32(uint256(1))) {
            s_yesVotes++;
        } else {
            s_noVotes++;
        }

        emit VoteCast(_nullifierHash, msg.sender, _vote == bytes32(uint256(1)), block.timestamp, s_yesVotes, s_noVotes);
    }

    //////////////
    // getters ///
    //////////////

    function getLeaf(uint256 index) public view returns (uint256) {
        return s_tree.leaves[index];
    }

    function getNode(uint256 index) public view returns (uint256) {
        return s_tree.sideNodes[index];
    }

    function getSize() public view returns (uint256) {
        return s_tree.size;
    }

    function getDepth() public view returns (uint256) {
        return s_tree.depth;
    }

    function getRoot() public view returns (uint256) {
        return s_tree.root();
    }

    function hasRegistered(address _voter) public view returns (bool) {
        return s_hasRegistered[_voter];
    }

    function isVoter(address _voter) public view returns (bool) {
        return s_voters[_voter];
    }

    function getVotingData(address _voter)
        public
        view
        returns (
            uint256 treeSize,
            uint256 treeDepth,
            uint256 treeRoot,
            bool isVoterStatus,
            bool hasRegisteredStatus,
            uint256 registrationDeadline
        )
    {
        return (
            s_tree.size, s_tree.depth, s_tree.root(), s_voters[_voter], s_hasRegistered[_voter], i_registrationDeadline
        );
    }

    function getVotingStats()
        public
        view
        returns (
            address contractOwner,
            string memory question,
            uint256 totalYesVotes,
            uint256 totalNoVotes,
            uint256 registrationDeadline
        )
    {
        return (owner(), s_question, s_yesVotes, s_noVotes, i_registrationDeadline);
    }
}
