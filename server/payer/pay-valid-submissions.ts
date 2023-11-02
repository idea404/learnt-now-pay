// This script asks the TutorialSubmissions contract
// for all submissions, filters those that are valid,
// requests the Payout contract to pay each 
// updating their status to PAID.

import { ethers } from "ethers";
import { Provider, Wallet } from "zksync-web3";
import fs from "fs";
import dotenv from "dotenv";
import { getDeployedContractDetailsFromVars, getL2RpcUrl, getPrivateKey } from "../../deploy/utils";

dotenv.config();

const NETWORK = process.env.NODE_ENV || "test"; // Default to localnet if NODE_ENV is not set
const RPC_URL = getL2RpcUrl(NETWORK); // Replace with L2 RPC URL
const PRIVATE_KEY = getPrivateKey(NETWORK); // Replace with private key

// Load the ABI for Payout
const poArtifact = JSON.parse(fs.readFileSync("./artifacts-zk/contracts/Payout.sol/Payout.json", "utf8"));
const poAbi = poArtifact.abi;

// Load the ABI for TutorialSubmission
const tsArtifact = JSON.parse(fs.readFileSync("./artifacts-zk/contracts/TutorialSubmission.sol/TutorialSubmission.json", "utf8"));
const tsAbi = tsArtifact.abi;

async function main() {
  const provider = new Provider(RPC_URL);
  const userWallet = new Wallet(PRIVATE_KEY, provider);
  const submissionsContract = new ethers.Contract(getDeployedContractDetailsFromVars(NETWORK, "TutorialSubmission").address, tsAbi, userWallet);
  const payoutContract = new ethers.Contract(getDeployedContractDetailsFromVars(NETWORK, "Payout").address, poAbi, userWallet);

  const submissions = await submissionsContract.viewSubmissions();
  // filter submissions for those with 'status' of 'VALID'
  const validSubmissions = submissions.filter((submission: { status: string; }) => submission.status === "VALID");
  console.log(`Found ${validSubmissions.length} valid submissions`);

  // pay each valid submission
  for (const submission of validSubmissions) {
    const poapNftId = submission.poapNftId.toNumber();
    const tutorialName = submission.tutorialName;

    // update status to PAID
    const updateStatusTx = await submissionsContract.updateSubmissionStatus(poapNftId, tutorialName, "PAID");
    await updateStatusTx.wait();
    console.log(`Updated status for ${JSON.stringify(submission)} to PAID`);

    try {
      // pay submission
      console.log(`Paying NFT ID ${poapNftId} for submission ${tutorialName}`);
      const tx = await payoutContract.payout(poapNftId, tutorialName);
      await tx.wait();
      console.log(`Paid NFT ID ${poapNftId} for tutorial: ${tutorialName}`);
    } catch (error: any) {
      // if error, update status to VALID
      console.log(`Error paying NFT ID ${poapNftId} for submission ${tutorialName}: ${error.message}`);
      const updateStatusTx = await submissionsContract.updateSubmissionStatus(poapNftId, tutorialName, "VALID");
      await updateStatusTx.wait();
      console.log(`Updated status for ${JSON.stringify(submission)} to VALID`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
