import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Read .env file manually
function readEnvFile(): Record<string, string> {
  const rootDir = path.resolve(__dirname, "../..");
  const envPath = path.join(rootDir, ".env");
  
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const content = fs.readFileSync(envPath, "utf-8");
  const env: Record<string, string> = {};
  
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join("=").trim();
      }
    }
  });
  
  return env;
}

async function main() {
  // Read .env file
  const env = readEnvFile();
  const contractAddress = process.env.CONTRACT_ADDRESS || env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("❌ CONTRACT_ADDRESS not set in environment variables");
    console.error("Please set CONTRACT_ADDRESS in your .env file");
    console.error("Or run: npm run deploy:local (which will update .env automatically)");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  
  console.log("Granting roles to deployer...");
  console.log("Contract address:", contractAddress);
  console.log("Deployer address:", deployer.address);
  console.log("Network:", await ethers.provider.getNetwork());
  
  // Get the contract instance
  const ChainEquityTokenFactory = await ethers.getContractFactory("ChainEquityToken");
  const token = ChainEquityTokenFactory.attach(contractAddress);
  
  // Calculate role hashes
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const APPROVER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("APPROVER_ROLE"));
  
  // Check current roles
  const hasMinterRole = await token.hasRole(MINTER_ROLE, deployer.address);
  const hasApproverRole = await token.hasRole(APPROVER_ROLE, deployer.address);
  
  console.log("\nCurrent roles:");
  console.log("  MINTER_ROLE:", hasMinterRole ? "✅" : "❌");
  console.log("  APPROVER_ROLE:", hasApproverRole ? "✅" : "❌");
  
  // Grant MINTER_ROLE if not already granted
  if (!hasMinterRole) {
    console.log("\n🔐 Granting MINTER_ROLE...");
    const grantMinterTx = await token.grantRole(MINTER_ROLE, deployer.address);
    await grantMinterTx.wait();
    console.log("  ✅ Granted MINTER_ROLE to", deployer.address);
  } else {
    console.log("\n⏭️  MINTER_ROLE already granted");
  }
  
  // Grant APPROVER_ROLE if not already granted
  if (!hasApproverRole) {
    console.log("\n🔐 Granting APPROVER_ROLE...");
    const grantApproverTx = await token.grantRole(APPROVER_ROLE, deployer.address);
    await grantApproverTx.wait();
    console.log("  ✅ Granted APPROVER_ROLE to", deployer.address);
  } else {
    console.log("\n⏭️  APPROVER_ROLE already granted");
  }
  
  // Verify roles
  const hasMinterRoleAfter = await token.hasRole(MINTER_ROLE, deployer.address);
  const hasApproverRoleAfter = await token.hasRole(APPROVER_ROLE, deployer.address);
  
  console.log("\n✅ Roles after granting:");
  console.log("  MINTER_ROLE:", hasMinterRoleAfter ? "✅" : "❌");
  console.log("  APPROVER_ROLE:", hasApproverRoleAfter ? "✅" : "❌");
  
  if (hasMinterRoleAfter && hasApproverRoleAfter) {
    console.log("\n✅ All roles granted successfully!");
  } else {
    console.log("\n❌ Failed to grant some roles");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Failed to grant roles:");
    console.error(error);
    process.exit(1);
  });

