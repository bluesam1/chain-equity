import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying ChainEquityToken contract...");
  console.log("Deployer address:", deployer.address);
  console.log("Network:", await ethers.provider.getNetwork());
  
  // Get the contract factory
  const ChainEquityTokenFactory = await ethers.getContractFactory("ChainEquityToken");
  
  // Deploy with initial symbol "CET"
  const initialSymbol = "CET";
  const token = await ChainEquityTokenFactory.deploy(initialSymbol);
  
  // Wait for deployment to complete
  await token.waitForDeployment();
  
  const contractAddress = await token.getAddress();
  
  console.log("\n✅ ChainEquityToken deployed successfully!");
  console.log("Contract address:", contractAddress);
  console.log("Initial symbol:", initialSymbol);
  
  // Grant roles to deployer
  console.log("\n🔐 Granting roles to deployer...");
  
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const APPROVER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("APPROVER_ROLE"));
  
  // Grant MINTER_ROLE to deployer
  const grantMinterTx = await token.grantRole(MINTER_ROLE, deployer.address);
  await grantMinterTx.wait();
  console.log("  ✅ Granted MINTER_ROLE to", deployer.address);
  
  // Grant APPROVER_ROLE to deployer
  const grantApproverTx = await token.grantRole(APPROVER_ROLE, deployer.address);
  await grantApproverTx.wait();
  console.log("  ✅ Granted APPROVER_ROLE to", deployer.address);
  
  console.log("\n✅ All roles granted successfully!");
  
  // Update .env files
  const rootDir = path.resolve(__dirname, "../..");
  const rootEnvPath = path.join(rootDir, ".env");
  const frontendEnvPath = path.join(rootDir, "frontend", ".env.local");
  
  // Update root .env file
  updateEnvFile(rootEnvPath, "CONTRACT_ADDRESS", contractAddress);
  
  // Update frontend/.env.local file
  updateEnvFile(frontendEnvPath, "VITE_CONTRACT_ADDRESS", contractAddress);
  
  console.log("\n✅ Environment files updated!");
  console.log(`  - ${rootEnvPath}`);
  console.log(`  - ${frontendEnvPath}`);
  console.log("\n📋 Contract address:", contractAddress);
}

function updateEnvFile(filePath: string, key: string, value: string) {
  let content = "";
  let exists = false;
  
  // Read existing file if it exists
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, "utf-8");
    exists = true;
  }
  
  // Check if key already exists
  const keyRegex = new RegExp(`^${key}=.*$`, "m");
  if (keyRegex.test(content)) {
    // Update existing key
    content = content.replace(keyRegex, `${key}=${value}`);
  } else {
    // Add new key
    if (content && !content.endsWith("\n")) {
      content += "\n";
    }
    content += `${key}=${value}\n`;
  }
  
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write file
  fs.writeFileSync(filePath, content, "utf-8");
  
  if (!exists) {
    console.log(`  Created ${filePath}`);
  } else {
    console.log(`  Updated ${filePath}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

