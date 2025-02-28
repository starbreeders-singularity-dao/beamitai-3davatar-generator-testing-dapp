
const hre = require("hardhat");

async function main() {
  // Get the contract factory through hardhat's ethers
  const ThreeDNFT = await hre.ethers.getContractFactory("ThreeDNFT");
  
  // Deploy the contract
  const nftContract = await ThreeDNFT.deploy();
  
  // Wait for deployment to finish - updated for Hardhat v2.19+
  await nftContract.waitForDeployment();
  
  // Log the deployed contract address - updated for Hardhat v2.19+
  console.log("ThreeDNFT deployed to:", await nftContract.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
