require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    // For local testing
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337
    },
    // World Chain (Optimism L2)
    worldchain: {
      url: process.env.WORLD_CHAIN_RPC_URL || "https://rpc.worldchain.dev",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 111,
      gasPrice: 1000000000 // 1 gwei
    },
    // Polygon Mumbai testnet
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    // Sepolia testnet
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  paths: {
    sources: "./MapMint",
    tests: "../test",
    cache: "../cache",
    artifacts: "../artifacts"
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
      sepolia: process.env.ETHERSCAN_API_KEY,
      worldchain: process.env.WORLDSCAN_API_KEY
    },
    customChains: [
      {
        network: "worldchain",
        chainId: 111,
        urls: {
          apiURL: "https://explorer.worldchain.dev/api",
          browserURL: "https://explorer.worldchain.dev"
        }
      }
    ]
  }
}; 