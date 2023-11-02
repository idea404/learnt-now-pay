// This script should:
// 1. mint an NFT for a provided address and a provided RPC URL and print ID of minted NFT
// 2. call the `addTutorialCategory` function of the payout contract and add a "Tutorial" category
// 3. send ETH to the recipient address

import { ethers } from 'ethers';
import { Provider, Wallet } from 'zksync-web3';
import fs from 'fs';
import dotenv from 'dotenv';
import { getDeployedContractDetailsFromVars, getL2RpcUrl, getPrivateKey } from '../deploy/utils';

dotenv.config();

// Configuration
const NETWORK = process.env.NODE_ENV || 'test'; // Default to localnet if NODE_ENV is not set
const RPC_URL = getL2RpcUrl(NETWORK); // Replace with L2 RPC URL
const PRIVATE_KEY = getPrivateKey(NETWORK); // Replace with private key
const POAP_NFT_CONTRACT_ADDRESS = getDeployedContractDetailsFromVars(NETWORK, 'PoapNFT').address; // Replace with POAP NFT contract address
const PAYOUT_CONTRACT_ADDRESS = getDeployedContractDetailsFromVars(NETWORK, 'Payout').address; // Replace with Payout contract address
const ETH_SEND_TO_PAYOUT = '0.1'; // Replace with the amount of ETH to send to the user
export const NFT_RECIPIENT_ADDRESS = '0x940755F8968253Cd9F436cAd780241d377BcfD11'; // Replace with the address that will receive the NFT // testnet
export const TUTORIAL_CATEGORY = 'PoapMultiplier'; // Replace with the category name
export let USER_NFT_ID = 2; // Replace with the NFT ID assigned to the user

// Load the ABI for PoapNFT
const poapNFTArtifact = JSON.parse(fs.readFileSync('./artifacts-zk/contracts/PoapNFT.sol/PoapNFT.json', 'utf8'));
const PoapNFTAbi = poapNFTArtifact.abi;

// Load the ABI for Payout
const payoutArtifact = JSON.parse(fs.readFileSync('./artifacts-zk/contracts/Payout.sol/Payout.json', 'utf8'));
const PayoutAbi = payoutArtifact.abi;

async function main() {
  const provider = new Provider(RPC_URL);
  const wallet = new Wallet(PRIVATE_KEY, provider);

  const poapNFTContract = new ethers.Contract(POAP_NFT_CONTRACT_ADDRESS, PoapNFTAbi, wallet);
  const payoutContract = new ethers.Contract(PAYOUT_CONTRACT_ADDRESS, PayoutAbi, wallet);

  // 1. Mint an NFT for the provided address
  // try {
  //   const mintTx = await poapNFTContract.mint(NFT_RECIPIENT_ADDRESS);
  //   await mintTx.wait();
  //   // 1.1 Print ID of minted NFT
  //   const tokenId = await poapNFTContract.tokenOfOwnerByIndex(NFT_RECIPIENT_ADDRESS, 0);
  //   console.log(`Minted NFT with ID: ${tokenId.toString()}`);
  //   USER_NFT_ID = tokenId;
  // } catch (e: any) {
  //   console.log('NFT already minted', "Contract reason:", e.error.reason);
  // }

  // 2. Call the `addTutorialCategory` function of the payout contract
  // try {
  //   const addCategoryTx = await payoutContract.addTutorialCategory(TUTORIAL_CATEGORY);
  //   await addCategoryTx.wait();
  //   console.log(`Added tutorial category ${TUTORIAL_CATEGORY}`);
  // } catch (e: any) {
  //   console.log('Category already exists', "Contract reason:", e.error.reason);
  // }

  // 3. Send ETH to the payout address
  try {
    const transferTx = await wallet.sendTransaction({
      to: PAYOUT_CONTRACT_ADDRESS,
      value: ethers.utils.parseEther(ETH_SEND_TO_PAYOUT),
    });
    await transferTx.wait();
    console.log(`Sent ${ETH_SEND_TO_PAYOUT} ETH to the recipient address`);
  } catch (e: any) {
    console.log('ETH already sent', "Contract reason:", e.error.reason);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }
);
