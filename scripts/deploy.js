// scripts/deploy.js
async function main() {
    const 3DNFT = await ethers.getContractFactory("3DNFT");
    const nftContract = await 3DNFT.deploy();
    await nftContract.waitForDeployment();
    console.log("3DNFT deployed to:", await nftContract.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
