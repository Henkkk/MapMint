// Deploy script for MapMint smart contracts
const hre = require("hardhat");

// WLD token address on World Chain
const WORLD_CHAIN_WLD_ADDRESS = "0xdC29bA0E647a5Ff2a906f8A28F15D8cE6124e590"; // Replace with actual address

async function main() {
  console.log("Deploying MapMint smart contracts...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  
  let wldTokenAddress;
  
  // Check if we're on World Chain
  const isWorldChain = hre.network.name === "worldchain";
  
  if (isWorldChain) {
    // On World Chain, use the real WLD token
    console.log("Detected World Chain network - using actual WLD token");
    wldTokenAddress = WORLD_CHAIN_WLD_ADDRESS;
    console.log(`Using WLD token at: ${wldTokenAddress}`);
  } else {
    // On other networks, deploy the mock WLD token
    console.log(`Detected ${hre.network.name} network - deploying MockWLD token`);
    const MockWLD = await hre.ethers.getContractFactory("MockWLD");
    const mockWLD = await MockWLD.deploy();
    await mockWLD.waitForDeployment();
    
    wldTokenAddress = await mockWLD.getAddress();
    console.log(`MockWLD deployed to: ${wldTokenAddress}`);
  }

  // Deploy the MapMintEscrow contract with the appropriate WLD token address
  const MapMintEscrow = await hre.ethers.getContractFactory("MapMintEscrow");
  const mapMintEscrow = await MapMintEscrow.deploy(wldTokenAddress);
  await mapMintEscrow.waitForDeployment();
  
  const escrowAddress = await mapMintEscrow.getAddress();
  console.log(`MapMintEscrow deployed to: ${escrowAddress}`);
  
  console.log("Deployment complete!");
  
  // For easier verification later
  console.log("Contract addresses to verify:");
  if (!isWorldChain) {
    console.log(`MockWLD: ${wldTokenAddress}`);
  }
  console.log(`MapMintEscrow: ${escrowAddress}`);
  
  // Wait for block confirmations to make verification easier
  console.log("Waiting for block confirmations...");
  if (!isWorldChain) {
    // Only wait for MockWLD if we deployed it
    const mockWLD = await hre.ethers.getContractAt("MockWLD", wldTokenAddress);
    await mockWLD.deploymentTransaction().wait(5);
  }
  await mapMintEscrow.deploymentTransaction().wait(5);
  
  // Optional: Verify contracts if on a public network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Verifying contracts...");
    
    try {
      if (!isWorldChain) {
        // Only verify MockWLD if we deployed it
        await hre.run("verify:verify", {
          address: wldTokenAddress,
          constructorArguments: [],
        });
      }
      
      await hre.run("verify:verify", {
        address: escrowAddress,
        constructorArguments: [wldTokenAddress],
      });
      
      console.log("Contracts verified!");
    } catch (error) {
      console.log("Verification failed:", error);
    }
  }
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 