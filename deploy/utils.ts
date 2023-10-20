import fs from "fs";
import path from "path";

const JSON_FILE_PATH = path.join(__dirname, "vars.json");

export function getPrivateKey(network: string): string {
  let privateKey: string | undefined;

  if (network == "test") {
    privateKey = process.env.WALLET_PRIVATE_KEY_TEST;
  }
  if (network == "localnet") {
    privateKey = process.env.WALLET_PRIVATE_KEY_LOCALNET;
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

export function getContractFromVars(network: string, contractName: string, varsPath = JSON_FILE_PATH) {
  const config = JSON.parse(fs.readFileSync(varsPath, "utf-8"));
  const deployedContracts = config[network].deployed;
  const existingContract = deployedContracts.find((contract: { name: string; }) => contract.name === contractName);

  if (!existingContract) {
    throw new Error(`Contract ${contractName} not found in vars.json`);
  }

  return existingContract;
}
