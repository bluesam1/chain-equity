import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying ChainEquityToken contract...");
  console.log("Deployer address:", deployer.address);
  console.log("Network:", await ethers.provider.getNetwork());
  
  // Get the contract factory
  const ChainEquityTokenFactory = await ethers.getContractFactory("ChainEquityToken");
  
  // Deploy with initial symbol "CET"
  // You can change this to any symbol you want
  const initialSymbol = "CET";
  const token = await ChainEquityTokenFactory.deploy(initialSymbol);
  
  // Wait for deployment to complete
  await token.waitForDeployment();
  
  const contractAddress = await token.getAddress();
  
  console.log("\n✅ ChainEquityToken deployed successfully!");
  console.log("Contract address:", contractAddress);
  console.log("Initial symbol:", initialSymbol);
  console.log("\n📋 Next steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Update CONTRACT_ADDRESS in your root .env file");
  console.log("3. Update VITE_CONTRACT_ADDRESS in frontend/.env.local file");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

