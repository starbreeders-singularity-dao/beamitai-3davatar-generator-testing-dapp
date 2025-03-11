
const hre = require("hardhat");

async function main() {
  // Get the contract factory through hardhat's ethers
  const ThreeDNFT = await hre.ethers.getContractFactory("ThreeDNFT");
  
  // Deploy the contract
  const nftContract = await ThreeDNFT.deploy();
  
  // Wait for deployment to finish - updated for Hardhat v2.19+
  await nftContract.waitForDeployment();
  
  const contractAddress = await nftContract.getAddress();
  console.log("\n=================================================");
  console.log(`ThreeDNFT deployed to: ${contractAddress}`);
  console.log("=================================================");
  console.log("Copy this address and update it in frontend/src/utils/nftUtils.js");
  console.log("=================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
