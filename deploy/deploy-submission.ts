import { Wallet } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { getPrivateKey } from "./utils";

// load env file
dotenv.config();

// load wallet private key from env file
const CONTRACT_NAME = "TutorialSubmission";
const JSON_FILE_PATH = path.join(__dirname, "vars.json");
const NETWORK = process.env.NODE_ENV || "test"; // Default to test if NODE_ENV is not set
const PRIVATE_KEY = getPrivateKey(NETWORK);

if (!PRIVATE_KEY)
  throw "⛔️ Private key not detected! Add it to the .env file!";

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the ${CONTRACT_NAME} contract`);

  // Initialize the wallet.
  const wallet = new Wallet(PRIVATE_KEY);

  // Create deployer object and load the artifact of the contract you want to deploy.
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact(CONTRACT_NAME);

  // Estimate contract deployment fee
  const deploymentFee = await deployer.estimateDeployFee(artifact, []);

  // Deploy this contract. The returned object will be of a `Contract` type, similarly to ones in `ethers`.
  const parsedFee = ethers.utils.formatEther(deploymentFee.toString());
  console.log(`The deployment is estimated to cost ${parsedFee} ETH`);

  const greeterContract = await deployer.deploy(artifact, []);

  //obtain the Constructor Arguments
  console.log(
    "Constructor args:" + greeterContract.interface.encodeDeploy([])
  );

  // Show the contract info.
  const contractAddress = greeterContract.address;
  console.log(`${artifact.contractName} was deployed to ${contractAddress}`);

  // Save the deployed contract address to vars.json
  const config = JSON.parse(fs.readFileSync(JSON_FILE_PATH, "utf-8"));

  if (!config[NETWORK]) {
    config[NETWORK] = { deployed: [] };
  }

  config[NETWORK].deployed.push({
    name: CONTRACT_NAME,
    address: contractAddress,
  });

  fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(config, null, 2));

  // verify contract for tesnet & mainnet
  if (NETWORK != "test") {
    // Contract MUST be fully qualified name (e.g. path/sourceName:contractName)
    const contractFullyQualifedName = `contracts/${CONTRACT_NAME}.sol:${CONTRACT_NAME}`;

    // Verify contract programmatically
    const verificationId = await hre.run("verify:verify", {
      address: contractAddress,
      contract: contractFullyQualifedName,
      constructorArguments: [],
      bytecode: artifact.bytecode,
    });
  } else {
    console.log(`Contract not verified, deployed locally.`);
  }
}
