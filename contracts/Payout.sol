// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IPOAP {
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId);
}

contract Payout {
    address private owner;
    address private constant poapNFTAccountAddress = 0x1234567890123456789012345678901234567890; // TODO: Replace with the actual POAP NFT contract address
    uint256 private constant PAYOUT_AMOUNT = 0.025 ether;

    // Mapping to track payouts
    mapping(bytes32 => bool) private payouts;

    // Dynamic array to represent tutorial categories
    string[] public tutorialCategories;
    // Enum to represent the status of each tutorial category
    enum TutorialStatus { Active, Inactive }
    mapping(string => TutorialStatus) public tutorialStatuses;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    function addTutorialCategory(string memory newCategory) external onlyOwner {
        tutorialCategories.push(newCategory);
        tutorialStatuses[newCategory] = TutorialStatus.Active;
    }

    function removeTutorialCategory(string memory categoryToRemove) external onlyOwner {
        require(tutorialStatuses[categoryToRemove] == TutorialStatus.Active, "Category not found or already inactive");
        tutorialStatuses[categoryToRemove] = TutorialStatus.Inactive;
    }

    function payout(address destinationAddress, string memory tutorialName) external onlyOwner {
        require(tutorialStatuses[tutorialName] == TutorialStatus.Active, "Invalid or inactive tutorial category");

        uint256 poapNFTId = IPOAP(poapNFTAccountAddress).tokenOfOwnerByIndex(destinationAddress, 0);
        require(poapNFTId != 0, "The destination address does not own a POAP NFT");

        bytes32 uniqueKey = keccak256(abi.encodePacked(poapNFTId, tutorialName));
        require(!payouts[uniqueKey], "Payout already made for this NFT ID and tutorial combination");

        payouts[uniqueKey] = true;
        payable(destinationAddress).transfer(PAYOUT_AMOUNT);
    }

    function emptyContract() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // View method to check if a payout has been made for a given NFT ID and tutorial name
    function hasPayoutBeenMade(uint256 poapNFTId, string memory tutorialName) external view returns (bool) {
        bytes32 uniqueKey = keccak256(abi.encodePacked(poapNFTId, tutorialName));
        return payouts[uniqueKey];
    }
}
