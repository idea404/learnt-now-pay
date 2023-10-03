// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PoapMultiplier {
    function getValue(uint256 value) public pure returns (uint256) {
        uint256 yourPoapNFTId = 42; // TODO: replace with your POAP NFT ID, now it is 42
        return value * yourPoapNFTId;
    }
}
