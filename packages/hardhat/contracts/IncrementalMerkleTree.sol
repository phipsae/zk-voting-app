//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {LeanIMT, LeanIMTData} from "@zk-kit/lean-imt.sol/LeanIMT.sol";
import {PoseidonT3} from "poseidon-solidity/PoseidonT3.sol";

contract IncrementalMerkleTree {
    using LeanIMT for LeanIMTData;

    LeanIMTData public tree;
    address public immutable owner;

    event NewLeaf(uint256 index, uint256 value);

    constructor(address _owner) {
        owner = _owner;
    }

    function insert(uint256 value) public {
        tree.insert(value);
        emit NewLeaf(tree.size - 1, value);
    }

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
