// This script deploys a tutorial submission
// simulating a dev who has completed the tutorial
// and would like to submit it for a bounty.
//
// Requires:
//  - a deployed TutorialSubmission contract
//  - a deployed PoapNFT contract
//  - a deployed tutorial contract
//  - a POAP NFT ID assigned to the user

import { ethers } from "ethers";
import { Provider, Wallet } from "zksync-web3";
import fs from "fs";
import dotenv from "dotenv";
import { getDeployedContractDetailsFromVars, getL2RpcUrl, getUserPrivateKey } from "../deploy/utils";

dotenv.config();

const NETWORK = process.env.NODE_ENV || "test"; // Default to localnet if NODE_ENV is not set
const RPC_URL = getL2RpcUrl(NETWORK); // Replace with L2 RPC URL
const PRIVATE_KEY = getUserPrivateKey(NETWORK); // Replace with private key
const CATEGORY = "PoapMultiplier"; // Replace with the category name
const USER_NFT_ID = 1; // Replace with the NFT ID assigned to the user

// Load the ABI for TutorialSubmission
const tsArtifact = JSON.parse(fs.readFileSync("./artifacts-zk/contracts/TutorialSubmission.sol/TutorialSubmission.json", "utf8"));
const tsAbi = tsArtifact.abi;

async function main() {
  const provider = new Provider(RPC_URL);
  const userWallet = new Wallet(PRIVATE_KEY, provider);

  const submission = {
    poapNftId: USER_NFT_ID,
    deployedTestnetAddress: getDeployedContractDetailsFromVars(NETWORK, CATEGORY).address,
    tutorialName: CATEGORY,
  };
  const submissionsContract = new ethers.Contract(getDeployedContractDetailsFromVars(NETWORK, "TutorialSubmission").address, tsAbi, userWallet);
  const addSubmissionTx = await submissionsContract.submitTutorial(submission.poapNftId, submission.deployedTestnetAddress, submission.tutorialName);
  await addSubmissionTx.wait();
  console.log(`Submitted tutorial ${submission.tutorialName} for POAP NFT ${submission.poapNftId}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
