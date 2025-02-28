import { ethers } from "ethers";
import abi from "../nftabi.json";
import { requestSignature } from "./requestSignature";


const contractAddress = "0x28571421e389f0553b5c261dc33f7b22bbb1b0e3";

export const mintNFT = async (userAddress: string, tokenId: string) => {
  try {
    const { signature, uri, originalContract, originalTokenId, chainId } = await requestSignature(userAddress, tokenId);

    if (!window.ethereum) {
      throw new Error("No wallet detected. Please install MetaMask.");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    // Send minting transaction
    const tx = await contract.mint(
      userAddress,
      tokenId,
      uri,
      originalContract,
      originalTokenId,
      chainId,
      signature
    );

    await tx.wait();
    console.log("NFT Minted! Transaction:", tx.hash);
    return tx.hash;
  } catch (error: any) {
    console.error("Minting error:", error);
    throw error;
  }
  
};
