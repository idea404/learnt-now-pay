# Simple Tutorial

Task: create and deploy a smart contract that has one function called `getValue` that takes in one argumat called `value` which can be any positive whole number and returns that number times your `POAP NFT ID` (#TODO: we should give this a catchy name) you received from attending one of our events. 

## Example Solidity

```solidity
pragma solidity ^0.8.0;

contract PoapMultiplier {
    function getValue(uint256 value) public pure returns (uint256) {
        return value * 31; // TODO: replace with your POAP NFT ID
    }
}
```
