import fs from "fs";
import path from "path";
import { ethers } from "ethers";

const JSON_FILE_PATH = path.join(__dirname, "vars.json");

export function getPrivateKey(network: string): string {
  let privateKey: string | undefined;

  if (network == "test") {
    privateKey = "7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";
  }
  if (network == "localnet") {
    privateKey = "7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";
  }
  if (network == "testnet") {
    privateKey = process.env.WALLET_PRIVATE_KEY_TESTNET;
  }
  if (network == "mainnet") {
    privateKey = process.env.WALLET_PRIVATE_KEY_MAINNET;
  }

  if (!privateKey) {
    throw "⛔️ Private key not detected! Add it to the .env file!";
  }

  return privateKey;
}

export function getUserPrivateKey(network: string): string {
  let privateKey: string | undefined;

  if (network == "test") {
    privateKey = "0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3";
  }
  if (network == "localnet") {
    privateKey = "0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3";
  }
  if (network == "testnet") {
    privateKey = process.env.USER_PRIVATE_KEY_TESTNET;
  }
  if (network == "mainnet") {
    privateKey = process.env.USER_PRIVATE_KEY_MAINNET;
  }

  if (!privateKey) {
    throw "⛔️ Private key not detected! Add it to the .env file!";
  }

  return privateKey;
}

export function getPublicKey(network: string): string {
  const privateKey = getPrivateKey(network);
  const wallet = new ethers.Wallet(privateKey);
  return wallet.address;
}

export function getUserPublicKey(network: string): string {
  const privateKey = getUserPrivateKey(network);
  const wallet = new ethers.Wallet(privateKey);
  return wallet.address;
}

export function getL2RpcUrl(network: string): string {
  let rpcUrl: string | undefined;

  if (network == "test") {
    rpcUrl = "http://127.0.0.1:8011";
  }
  if (network == "localnet") {
    rpcUrl = "http://127.0.0.1:3050";
  }
  if (network == "testnet") {
    rpcUrl = "https://zksync2-testnet.zksync.dev";
  }
  if (network == "mainnet") {
    throw "⛔️ Mainnet not supported!";
  }

  if (!rpcUrl) {
    throw "⛔️ L2 RPC URL not detected! Add it to the .env file!";
  }

  return rpcUrl;
}

export function saveContractToVars(network: string, contractName: string, contractAddress: string, varsPath = JSON_FILE_PATH) {
  console.log(`Saving ${contractName} to vars.json`);
  const config = JSON.parse(fs.readFileSync(varsPath, "utf-8"));

  if (!config[network]) {
    config[network] = { deployed: [] };
  }

  const deployedContracts = config[network].deployed;
  const existingContractIndex = deployedContracts.findIndex((contract: { name: string; }) => contract.name === contractName);

  if (existingContractIndex === -1) {
    console.log(`Adding ${contractName} to vars.json`);
    deployedContracts.push({
      name: contractName,
      address: contractAddress,
    });
  } else {
    console.log(`Updating ${contractName} in vars.json`);
    deployedContracts[existingContractIndex].address = contractAddress;
  }

  fs.writeFileSync(varsPath, JSON.stringify(config, null, 2));
}

export function getDeployedContractDetailsFromVars(network: string, contractName: string, varsPath = JSON_FILE_PATH) {
  const config = JSON.parse(fs.readFileSync(varsPath, "utf-8"));
  const deployedContracts = config[network].deployed;
  const existingContract = deployedContracts.find((contract: { name: string; }) => contract.name === contractName);

  if (!existingContract) {
    throw new Error(`Contract ${contractName} not found in vars.json`);
  }

  return existingContract;
}
