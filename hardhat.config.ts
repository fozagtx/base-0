import "./tasks";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-foundry";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import { config as dotenvConfig } from "dotenv";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "hardhat-gas-reporter";
import { HardhatUserConfig } from "hardhat/config";
import "solidity-coverage";

dotenvConfig();

// If not set, it uses the hardhat account 0 private key.
const deployerPrivateKey =
  process.env.DEPLOYER_PRIVATE_KEY ??
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20", // Updated to match Filecoin docs
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  defaultNetwork: "calibration",
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    // Filecoin Calibration Testnet
    calibration: {
      url: "https://api.calibration.node.glif.io/rpc/v1",
      accounts: [deployerPrivateKey],
      chainId: 314159,
    },
    // Filecoin Mainnet
    filecoin: {
      url: "https://api.node.glif.io/rpc/v1",
      accounts: [deployerPrivateKey],
      chainId: 314,
    },
  },
  // Paths for frontend integration
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  // Generate TypeScript types for frontend
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  sourcify: {
    enabled: false,
  },
};

export default config;
