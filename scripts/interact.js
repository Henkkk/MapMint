// Script to interact with the deployed MapMint contracts
const hre = require("hardhat");

// WLD token address on World Chain
const WORLD_CHAIN_WLD_ADDRESS = "0xdC29bA0E647a5Ff2a906f8A28F15D8cE6124e590"; // Replace with actual address

// Contract addresses - replace with your deployed contract addresses after deployment
const MOCK_WLD_ADDRESS = process.env.MOCK_WLD_ADDRESS || "0x..."; // Used for non-World Chain networks
const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS || "0x...";   // Replace with your deployed escrow address

async function main() {
  // Get signers
  const [deployer, user1, user2] = await hre.ethers.getSigners();
  
  console.log("Interacting with contracts with the account:", deployer.address);
  
  // Check if we're on World Chain
  const isWorldChain = hre.network.name === "worldchain";
  const wldTokenAddress = isWorldChain ? WORLD_CHAIN_WLD_ADDRESS : MOCK_WLD_ADDRESS;
  
  console.log(`Using ${isWorldChain ? "actual" : "mock"} WLD token at: ${wldTokenAddress}`);
  
  // Get contract instances
  const wldToken = await hre.ethers.getContractAt(isWorldChain ? "IERC20" : "MockWLD", wldTokenAddress);
  const escrow = await hre.ethers.getContractAt("MapMintEscrow", ESCROW_ADDRESS);
  
  // Get token details
  let name, symbol, decimals;
  
  try {
    name = await wldToken.name();
    symbol = await wldToken.symbol();
    decimals = await wldToken.decimals();
    
    console.log(`Token Name: ${name}`);
    console.log(`Token Symbol: ${symbol}`);
    console.log(`Token Decimals: ${decimals}`);
  } catch (error) {
    console.warn("Could not fetch all token details, using defaults");
    name = "WorldCoin";
    symbol = "WLD";
    decimals = 18;
  }
  
  // Get token balances
  const deployerBalance = await wldToken.balanceOf(deployer.address);
  console.log(`Deployer's balance: ${hre.ethers.formatUnits(deployerBalance, decimals)} ${symbol}`);
  
  // If on local network with mock token, mint some tokens for testing
  if (!isWorldChain) {
    try {
      const mintAmount = hre.ethers.parseUnits("1000", decimals);
      await wldToken.mint(user1.address, mintAmount);
      await wldToken.mint(user2.address, mintAmount);
      
      console.log(`Minted ${hre.ethers.formatUnits(mintAmount, decimals)} ${symbol} to ${user1.address}`);
      console.log(`Minted ${hre.ethers.formatUnits(mintAmount, decimals)} ${symbol} to ${user2.address}`);
    } catch (error) {
      console.error("Error minting tokens:", error);
    }
  }
  
  // Check user balances
  const user1Balance = await wldToken.balanceOf(user1.address);
  const user2Balance = await wldToken.balanceOf(user2.address);
  
  console.log(`User1's balance: ${hre.ethers.formatUnits(user1Balance, decimals)} ${symbol}`);
  console.log(`User2's balance: ${hre.ethers.formatUnits(user2Balance, decimals)} ${symbol}`);
  
  // If user has enough tokens, create a project
  if (user1Balance > 0) {
    // Example of creating a project
    // First, approve tokens to the escrow contract
    const projectReward = hre.ethers.parseUnits("10", decimals); // Lower amount for testing on real network
    
    console.log(`Approving ${hre.ethers.formatUnits(projectReward, decimals)} ${symbol} to escrow contract...`);
    await wldToken.connect(user1).approve(escrow.address, projectReward);
    
    // Create a project
    const projectId = `Project_${Date.now()}`; // Generate unique project ID
    const projectDuration = 30 * 24 * 60 * 60; // 30 days in seconds
    
    console.log(`Creating project with ID: ${projectId}...`);
    await escrow.connect(user1).createProject(projectId, projectReward, projectDuration);
    
    // Get project details
    const projectDetails = await escrow.getProjectDetails(projectId);
    console.log("Project created successfully!");
    console.log("Project Details:");
    console.log(`- Creator: ${projectDetails[0]}`);
    console.log(`- Total Reward: ${hre.ethers.formatUnits(projectDetails[1], decimals)} ${symbol}`);
    console.log(`- Start Time: ${new Date(Number(projectDetails[2]) * 1000)}`);
    console.log(`- End Time: ${new Date(Number(projectDetails[3]) * 1000)}`);
    console.log(`- Status: ${projectDetails[4]}`); // 0 = Active, 1 = Completed, 2 = Cancelled
    console.log(`- Total Contributions: ${projectDetails[5]}`);
    
    // Example of adding contributions
    console.log("Adding contributions...");
    await escrow.connect(user1).addContribution(projectId, user2.address);
    await escrow.connect(user1).addContribution(projectId, user2.address);
    
    // Check contribution count
    const contributionCount = await escrow.getContributionCount(projectId, user2.address);
    console.log(`User2 has made ${contributionCount} contributions to the project`);
    
    // Complete the project to allow reward claims
    console.log("Completing the project...");
    await escrow.connect(user1).completeProject(projectId);
    
    // Get updated project details
    const updatedDetails = await escrow.getProjectDetails(projectId);
    console.log(`Project status is now: ${updatedDetails[4]}`); // Should be 1 (Completed)
    
    // Claim rewards
    console.log("Claiming rewards...");
    await escrow.connect(user2).claimRewards(projectId);
    
    // Check user2's new balance
    const user2NewBalance = await wldToken.balanceOf(user2.address);
    console.log(`User2's new balance after claiming rewards: ${hre.ethers.formatUnits(user2NewBalance, decimals)} ${symbol}`);
    console.log(`User2 received ${hre.ethers.formatUnits(user2NewBalance - user2Balance, decimals)} ${symbol} as reward`);
  } else {
    console.log(`User1 doesn't have enough tokens to create a project. Please fund the account first.`);
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 