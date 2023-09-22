// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PoapMultiplier {
    function getValue(uint256 value) public pure returns (uint256) {
        return value * 31; // TODO: replace with your POAP NFT ID
    }
}
