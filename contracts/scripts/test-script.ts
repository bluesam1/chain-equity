import { ethers } from "hardhat";

async function main() {
  console.log("Hardhat TypeScript script execution test");
  console.log("Network:", await ethers.provider.getNetwork());
  console.log("Script execution successful!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
