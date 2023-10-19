// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PoapMultiplier {
    function getValue(uint256 value) public pure returns (uint256) {
        uint256 yourPoapNFTId = 1; // TODO: replace with your POAP NFT ID
        return value * yourPoapNFTId;
    }
}
