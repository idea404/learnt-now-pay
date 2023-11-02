// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TutorialSubmission {
    
    struct Submission {
        uint256 poapNftId;
        string deployedTestnetAddress;
        string tutorialName;
        string status;
    }

    // Array to store all submissions
    Submission[] public submissions;

    // Mapping from POAP NFT ID to an array of submissions
    mapping(uint256 => Submission[]) public accountSubmissions;

    // Array of authorized account addresses
    address[] public authorizedAddresses;

    // Events
    event TutorialSubmitted(uint256 poapNftId, string deployedTestnetAddress, string tutorialName);
    event StatusUpdated(uint256 poapNftId, string tutorialName, string newStatus);

    constructor() {
        // The contract deployer is initially an authorized address
        authorizedAddresses.push(msg.sender);
    }

    modifier onlyAuthorized() {
        bool isAuthorized = false;
        for (uint256 i = 0; i < authorizedAddresses.length; i++) {
            if (msg.sender == authorizedAddresses[i]) {
                isAuthorized = true;
                break;
            }
        }
        require(isAuthorized, "Not authorized to call this function");
        _;
    }

    function _assertIsNewTutorial(uint256 poapNftId, string memory tutorialName, string memory deployedTestnetAddress) private view {
        for (uint256 i = 0; i < accountSubmissions[poapNftId].length; i++) {
            Submission memory submission = accountSubmissions[poapNftId][i];
            bool isSameTutorial = keccak256(abi.encodePacked(submission.tutorialName)) == keccak256(abi.encodePacked(tutorialName));
            bool isSameDeployedAddress = keccak256(abi.encodePacked(submission.deployedTestnetAddress)) == keccak256(abi.encodePacked(deployedTestnetAddress));
            if (isSameTutorial && isSameDeployedAddress) {
                revert("Tutorial already submitted");
            }
        }
    }

    function submitTutorial(uint256 poapNftId, string memory deployedTestnetAddress, string memory tutorialName) public {
        _assertIsNewTutorial(poapNftId, tutorialName, deployedTestnetAddress);

        Submission memory newSubmission = Submission({
            poapNftId: poapNftId,
            deployedTestnetAddress: deployedTestnetAddress,
            tutorialName: tutorialName,
            status: "PENDING"
        });

        submissions.push(newSubmission);
        accountSubmissions[poapNftId].push(newSubmission);

        emit TutorialSubmitted(poapNftId, deployedTestnetAddress, tutorialName);
    }

    function viewSubmissions() public view returns (Submission[] memory) {
        return submissions;
    }

    function viewAccountSubmissions(uint256 poapNftId) public view returns (Submission[] memory) {
        return accountSubmissions[poapNftId];
    }

    function updateSubmissionStatus(uint256 poapNftId, string memory tutorialName, string memory newStatus) public onlyAuthorized {
        for (uint256 i = 0; i < submissions.length; i++) {
            if (submissions[i].poapNftId == poapNftId && keccak256(abi.encodePacked(submissions[i].tutorialName)) == keccak256(abi.encodePacked(tutorialName))) {
                submissions[i].status = newStatus;
                emit StatusUpdated(poapNftId, tutorialName, newStatus);
                break;
            }
        }
    }

    function addAuthorizedAddress(address newAddress) public onlyAuthorized {
        authorizedAddresses.push(newAddress);
    }

    function removeAuthorizedAddress(address addressToRemove) public onlyAuthorized {
        for (uint256 i = 0; i < authorizedAddresses.length; i++) {
            if (authorizedAddresses[i] == addressToRemove) {
                authorizedAddresses[i] = authorizedAddresses[authorizedAddresses.length - 1];
                authorizedAddresses.pop();
                break;
            }
        }
    }
}
