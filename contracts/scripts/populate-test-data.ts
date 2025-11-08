import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import type { ChainEquityToken } from "../typechain-types/src/ChainEquityToken";

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

// Helper function to get random integer between min and max (inclusive)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get random element from array
function randomElement<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

// Helper function to sleep/delay
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Read .env file
  const env = readEnvFile();
  const contractAddress = process.env.CONTRACT_ADDRESS || env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("❌ CONTRACT_ADDRESS not set in environment variables");
    console.error("Please set CONTRACT_ADDRESS in your .env file");
    process.exit(1);
  }

  // Get all signers (hardhat accounts)
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  
  console.log("🚀 Starting test data population...");
  console.log("Contract address:", contractAddress);
  console.log("Deployer address:", deployer.address);
  console.log("Network:", await ethers.provider.getNetwork());
  console.log(`Available accounts: ${signers.length}`);
  
  // Get the contract instance
  const ChainEquityTokenFactory = await ethers.getContractFactory("ChainEquityToken");
  const token = ChainEquityTokenFactory.attach(contractAddress) as unknown as ChainEquityToken;
  
  // Check if deployer has APPROVER_ROLE and MINTER_ROLE
  const APPROVER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("APPROVER_ROLE"));
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  
  const hasApproverRole = await token.hasRole(APPROVER_ROLE, deployer.address);
  const hasMinterRole = await token.hasRole(MINTER_ROLE, deployer.address);
  
  if (!hasApproverRole || !hasMinterRole) {
    console.error("❌ Deployer must have APPROVER_ROLE and MINTER_ROLE");
    console.error("Run: npx hardhat run scripts/grant-roles.ts --network localhost");
    process.exit(1);
  }
  
  console.log("\n📋 Configuration:");
  console.log("  APPROVER_ROLE:", hasApproverRole ? "✅" : "❌");
  console.log("  MINTER_ROLE:", hasMinterRole ? "✅" : "❌");
  
  // Step 1: Approve all hardhat addresses
  console.log("\n🔐 Step 1: Approving all hardhat addresses...");
  const addressesToApprove = signers.map(s => s.address);
  let approvedCount = 0;
  let alreadyApprovedCount = 0;
  
  for (const address of addressesToApprove) {
    const isApproved = await token.allowlist(address);
    if (!isApproved) {
      try {
        const tx = await token.approveWallet(address);
        await tx.wait();
        console.log(`  ✅ Approved: ${address}`);
        approvedCount++;
        await sleep(100); // Small delay to avoid rate limiting
      } catch (error) {
        console.error(`  ❌ Failed to approve ${address}:`, error);
      }
    } else {
      console.log(`  ⏭️  Already approved: ${address}`);
      alreadyApprovedCount++;
    }
  }
  
  console.log(`\n✅ Approval complete: ${approvedCount} new, ${alreadyApprovedCount} already approved`);
  
  // Get decimals from contract
  const decimals = await token.decimals();
  console.log(`\n📏 Token decimals: ${decimals}`);
  
  // Step 2: Mixed mints and transfers (realistic flow)
  console.log("\n💰 Step 2: Generating realistic transaction flow...");
  const totalOperations = randomInt(30, 60); // Total operations (mints + transfers)
  const mintRatio = 0.3; // 30% mints, 70% transfers (more realistic)
  const mintCount = Math.floor(totalOperations * mintRatio);
  const transferCount = totalOperations - mintCount;
  
  const mintAmounts = [100, 500, 1000, 2000, 5000, 10000, 25000, 50000, 100000]; // Various amounts
  const transferAmounts = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000]; // Various amounts
  
  // Create operation queue: mix mints and transfers
  type Operation = { type: 'mint' | 'transfer'; recipient?: typeof signers[0]; sender?: typeof signers[0]; amount: number };
  const operations: Operation[] = [];
  
  // Add mints
  for (let i = 0; i < mintCount; i++) {
    operations.push({
      type: 'mint',
      recipient: randomElement(signers),
      amount: randomElement(mintAmounts)
    });
  }
  
  // Add transfers (need to ensure sender has balance, so we'll check during execution)
  for (let i = 0; i < transferCount; i++) {
    operations.push({
      type: 'transfer',
      sender: randomElement(signers),
      recipient: randomElement(signers),
      amount: randomElement(transferAmounts)
    });
  }
  
  // Shuffle operations to create realistic mixed flow
  for (let i = operations.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [operations[i], operations[j]] = [operations[j], operations[i]];
  }
  
  let mintedCount = 0;
  let transferredCount = 0;
  let skippedCount = 0;
  
  // Execute operations in mixed order
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    
    if (op.type === 'mint') {
      const amountWei = ethers.parseUnits(op.amount.toString(), decimals);
      
      try {
        const tx = await token.mint(op.recipient!.address, amountWei);
        await tx.wait();
        console.log(`  ✅ [${i + 1}/${totalOperations}] Minted ${op.amount} tokens to ${op.recipient!.address.slice(0, 8)}...`);
        mintedCount++;
        await sleep(200); // Delay between operations
      } catch (error) {
        console.error(`  ❌ [${i + 1}/${totalOperations}] Failed to mint to ${op.recipient!.address}:`, error);
      }
    } else if (op.type === 'transfer') {
      // Ensure sender and recipient are different
      if (op.sender!.address === op.recipient!.address) {
        op.recipient = randomElement(signers.filter(s => s.address !== op.sender!.address));
      }
      
      const amountWei = ethers.parseUnits(op.amount.toString(), decimals);
      
      try {
        // Check sender balance first
        const balance = await token.balanceOf(op.sender!.address);
        if (balance < amountWei) {
          console.log(`  ⏭️  [${i + 1}/${totalOperations}] Skipping transfer: ${op.sender!.address.slice(0, 8)}... has insufficient balance (${ethers.formatUnits(balance, decimals)} < ${op.amount})`);
          skippedCount++;
          continue;
        }
        
        // Connect sender to contract and transfer
        const tokenWithSender = token.connect(op.sender!);
        const tx = await tokenWithSender.transfer(op.recipient!.address, amountWei);
        await tx.wait();
        console.log(`  ✅ [${i + 1}/${totalOperations}] Transferred ${op.amount} tokens from ${op.sender!.address.slice(0, 8)}... to ${op.recipient!.address.slice(0, 8)}...`);
        transferredCount++;
        await sleep(200); // Delay between operations
      } catch (error) {
        console.error(`  ❌ [${i + 1}/${totalOperations}] Failed to transfer from ${op.sender!.address}:`, error);
      }
    }
  }
  
  console.log(`\n✅ Transaction flow complete: ${mintedCount} mints, ${transferredCount} transfers, ${skippedCount} skipped`);
  
  // Summary
  console.log("\n📊 Summary:");
  console.log(`  Accounts approved: ${addressesToApprove.length}`);
  console.log(`  Mints performed: ${mintedCount}`);
  console.log(`  Transfers performed: ${transferredCount}`);
  console.log(`  Transfers skipped (insufficient balance): ${skippedCount}`);
  console.log(`  Total operations: ${mintedCount + transferredCount + skippedCount}`);
  console.log("\n✅ Test data population complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test data population failed:");
    console.error(error);
    process.exit(1);
  });

