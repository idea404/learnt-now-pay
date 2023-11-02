import { HardhatUserConfig } from "hardhat/config";

import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";

import "@matterlabs/hardhat-zksync-verify";
import { getL2RpcUrl } from "./deploy/utils";
import dotenv from "dotenv";

dotenv.config();

// dynamically changes endpoints for local tests
const L2_RPC_URL = getL2RpcUrl(process.env.NODE_ENV || "test");
export const zkSyncNetwork =
  process.env.NODE_ENV == "test" || process.env.NODE_ENV == "localnet"
    ? {
        url: L2_RPC_URL,
        ethNetwork: "http://127.0.0.1:8545",
        zksync: true,
      }
    : {
        url: L2_RPC_URL,
        ethNetwork: "goerli",
        zksync: true,
        // contract verification endpoint
        verifyURL: "https://zksync2-testnet-explorer.zksync.dev/contract_verification",
      };

const config: HardhatUserConfig = {
  zksolc: {
    version: "latest",
    settings: {},
  },
  defaultNetwork: "zkSyncNetwork",
  networks: {
    hardhat: {
      zksync: false,
    },
    zkSyncNetwork,
  },
  solidity: {
    version: "0.8.17",
  },
};

export default config;
