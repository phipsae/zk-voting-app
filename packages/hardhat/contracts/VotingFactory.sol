// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Voting} from "./Voting.sol";
import {IVerifier} from "./Verifier.sol";

/// @title VotingFactory
/// @notice Deploys new Voting instances and tracks them
contract VotingFactory {
    /// @notice Global verifier used by all Voting instances
    IVerifier public immutable verifier;

    /// @notice List of all Voting contract addresses created by this factory
    // TODO: remove -- and use events instead
    address[] public allVotings;

    /// @notice Mapping from creator address to their deployed Voting contracts
    mapping(address => address[]) private creatorToVotings;

    /// @dev Emitted when a new Voting is created
    event VotingCreated(address indexed creator, address indexed voting, string question);

    constructor(IVerifier _verifier) {
        verifier = _verifier;
    }

    /// @notice Creates a new Voting instance
    /// @param _question The human-readable question for this vote
    /// @return voting The address of the newly created Voting contract
    function createVoting(string calldata _question) external returns (address voting) {
        Voting instance = new Voting(verifier, _question);

        instance.transferOwnership(msg.sender);

        voting = address(instance);
        allVotings.push(voting);
        creatorToVotings[msg.sender].push(voting);

        emit VotingCreated(msg.sender, voting, _question);
    }

    /// @notice Returns the list of Voting contracts created by a specific creator
    function getVotingsByCreator(address creator) external view returns (address[] memory) {
        return creatorToVotings[creator];
    }
}
