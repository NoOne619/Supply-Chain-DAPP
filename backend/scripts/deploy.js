const hre = require("hardhat");

async function main() {
  // 1. Get the contract to deploy
  const SupplyChain = await hre.ethers.getContractFactory("Abdullah_supplychain");

  console.log("Deploying Abdullah_supplychain contract...");

  // 2. Deploy the contract
  const supplyChain = await SupplyChain.deploy();

  // 3. Wait for the deployment to complete
  await supplyChain.waitForDeployment();

  // 4. Get the deployed address
  const address = await supplyChain.getAddress();

  console.log("----------------------------------------------------");
  console.log("Abdullah_supplychain deployed to:", address);
  console.log("----------------------------------------------------");
  console.log("COPY THE ADDRESS ABOVE! You will need it for the Frontend.");
}

// Handle errors
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});