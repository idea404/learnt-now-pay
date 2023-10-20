// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IPOAP {
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract Payout {
    address private owner;
    IPOAP private poapNFTContract; // Use the IPOAP interface to interact with the POAP NFT contract
    uint256 private constant PAYOUT_AMOUNT = 0.025 ether;

    // Mapping to track payouts
    mapping(bytes32 => bool) private payouts;

    // Dynamic array to represent tutorial categories
    string[] public tutorialCategories;
    // Enum to represent the status of each tutorial category
    enum TutorialStatus { NotSet, Active, Inactive }
    mapping(string => TutorialStatus) public tutorialStatuses;

    constructor(address _poapNFTAcountAddress) {
        poapNFTContract = IPOAP(_poapNFTAcountAddress); // Initialize the poapNFTContract using the provided address
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    receive() external payable {}

    function addTutorialCategory(string memory newCategory) external onlyOwner {
        require(tutorialStatuses[newCategory] == TutorialStatus.NotSet, "Category already exists");
        tutorialCategories.push(newCategory);
        tutorialStatuses[newCategory] = TutorialStatus.Active;
    }

    function removeTutorialCategory(string memory categoryToRemove) external onlyOwner {
        require(tutorialStatuses[categoryToRemove] == TutorialStatus.Active, "Category not found or already inactive");
        tutorialStatuses[categoryToRemove] = TutorialStatus.Inactive;
    }

    function payout(uint256 poapNFTId, string memory tutorialName) external onlyOwner {
        require(tutorialStatuses[tutorialName] != TutorialStatus.NotSet && tutorialStatuses[tutorialName] == TutorialStatus.Active, "Tutorial category not found or inactive");

        bytes32 uniqueKey = keccak256(abi.encodePacked(poapNFTId, tutorialName));
        require(!payouts[uniqueKey], "Payout already made for this NFT ID and tutorial combination");

        // Retrieve the owner of the NFT using the ownerOf function
        address nftOwner = poapNFTContract.ownerOf(poapNFTId);
        require(nftOwner != address(0), "Invalid NFT ID");

        payouts[uniqueKey] = true;
        (bool s, ) = nftOwner.call{value: PAYOUT_AMOUNT}("");
        if (!s) {
            payouts[uniqueKey] = false;
        }
        require(s, "Transfer failed");
    }

    function emptyContract() external onlyOwner {
        (bool s, ) = payable(owner).call{value: address(this).balance}("");
        require(s, "Transfer failed");
    }

    // View method to check if a payout has been made for a given NFT ID and tutorial name
    function hasPayoutBeenMade(uint256 poapNFTId, string memory tutorialName) external view returns (bool) {
        bytes32 uniqueKey = keccak256(abi.encodePacked(poapNFTId, tutorialName));
        return payouts[uniqueKey];
    }
}
