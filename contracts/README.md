# MapMint Smart Contracts

This directory contains the smart contracts for the MapMint platform. These contracts manage the escrow of WorldCoin (WLD) tokens for projects and distribute rewards to contributors based on their participation.

## Contracts

1. **MapMintEscrow.sol**: The main contract that handles project creation, contribution tracking, and reward distribution.
2. **MockWLD.sol**: A mock WorldCoin token for testing purposes.

## Development Setup

### Prerequisites

- Node.js v16+
- npm or yarn

### Installation

1. Install dependencies:
```
npm install
```

2. Copy `.env.example` to `.env` and fill in the required values:
```
cp .env.example .env
```

### Compilation

Compile the contracts:
```
npx hardhat compile
```

### Local Testing

Start a local Hardhat node:
```
npx hardhat node
```

Deploy contracts to the local node:
```
npx hardhat run --network localhost scripts/deploy/deploy.js
```

### Deployment to Testnet

Deploy to Sepolia testnet:
```
npx hardhat run --network sepolia scripts/deploy/deploy.js
```

Deploy to Mumbai testnet:
```
npx hardhat run --network mumbai scripts/deploy/deploy.js
```

### Deployment to World Chain

Deploy to World Chain (Worldcoin's Optimism L2):
```
npx hardhat run --network worldchain scripts/deploy/deploy.js
```

When deploying to World Chain, you'll be using the actual WLD token instead of the mock version. Update the deployment script to use the official WLD token address for this network.

### Interacting with Contracts

After deployment, update the contract addresses in `scripts/interact.js` and run:
```
npx hardhat run --network localhost scripts/interact.js
```

For World Chain interaction:
```
npx hardhat run --network worldchain scripts/interact.js
```

## Contract Flow

1. **Project Creation**:
   - Project creator approves WLD tokens to the escrow contract
   - Creator calls `createProject()` with project ID (IPFS CID), reward amount, and duration
   - WLD tokens are transferred to the escrow contract

2. **Data Contribution**:
   - When users contribute data, the project owner or contract owner calls `addContribution()`
   - The contract tracks contributions per user

3. **Project Completion**:
   - Project creator calls `completeProject()` when the project is done
   - Contributors can claim their rewards based on their contribution percentage

4. **Reward Claiming**:
   - Contributors call `claimRewards()` to receive their WLD tokens
   - Rewards are calculated proportionally to their contributions

5. **Project Cancellation** (optional):
   - If needed, the creator can call `cancelProject()` to return funds

## World Chain Integration

### Overview
World Chain is Worldcoin's Layer 2 solution built on Optimism, focused on providing a scalable, low-cost environment for Worldcoin applications.

### Configuration
- Network Name: World Chain
- RPC URL: https://rpc.worldchain.dev
- Chain ID: 111
- Currency Symbol: WLD
- Block Explorer: https://explorer.worldchain.dev

### WLD Token
When deploying to World Chain, you'll interact with the native WLD token. The token is already available on this network, so there's no need to deploy the MockWLD contract.

### Verification
For contract verification on World Chain explorer:
```
npx hardhat verify --network worldchain DEPLOYED_CONTRACT_ADDRESS CONSTRUCTOR_ARGUMENTS
```

## For Hackathon Demo

For the MapMint hackathon demo, we can:

1. Deploy to a local Hardhat node or World Chain testnet
2. Use the MockWLD token for local testing, and real WLD token on World Chain
3. Record contract addresses for front-end integration
4. Demonstrate the entire flow from project creation to reward distribution

The front-end can simulate the payment process by showing UI elements that would connect to the smart contract in a production version. 