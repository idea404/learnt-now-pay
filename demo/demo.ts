// This script should:
// 1. mint an NFT for a provided address and a provided RPC URL
// 2. print ID of minted NFT
// 3. call the `addTutorialCategory` function of the payout contract and add a "Tutorial" category

import { ethers } from 'ethers';
import { Provider, Wallet } from 'zksync-web3';
import fs from 'fs';
import dotenv from 'dotenv';
import { getContractFromVars, getPrivateKey } from '../deploy/utils';

dotenv.config();

// Configuration
const NETWORK = process.env.NODE_ENV || 'localnet'; // Default to localnet if NODE_ENV is not set
const RPC_URL = 'http://127.0.0.1:8011'; // Replace with L2 RPC URL
const PRIVATE_KEY = getPrivateKey(NETWORK); // Replace with private key
const POAP_NFT_CONTRACT_ADDRESS = getContractFromVars(NETWORK, 'PoapNFT').address; // Replace with POAP NFT contract address
const PAYOUT_CONTRACT_ADDRESS = getContractFromVars(NETWORK, 'Payout').address; // Replace with Payout contract address
const RECIPIENT_ADDRESS = '0xcfc5Ff8F4C26ebE2Cb23fBE83C6D537BEAE0C1A0'; // Replace with the address that will receive the NFT // testnet

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
  const mintTx = await poapNFTContract.mint(RECIPIENT_ADDRESS);
  await mintTx.wait();

  // 2. Print ID of minted NFT
  const tokenId = await poapNFTContract.tokenOfOwnerByIndex(RECIPIENT_ADDRESS, 0);
  console.log(`Minted NFT with ID: ${tokenId.toString()}`);

  // 3. Call the `addTutorialCategory` function of the payout contract
  const addCategoryTx = await payoutContract.addTutorialCategory('Tutorial');
  await addCategoryTx.wait();
  console.log('Added tutorial category "Tutorial"');

  // 4. Send 100 ETH to the recipient address
  const transferTx = await wallet.sendTransaction({
    to: RECIPIENT_ADDRESS,
    value: ethers.utils.parseEther('100'),
  });
  await transferTx.wait();
  console.log('Sent 100 ETH to the recipient address');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }
);
