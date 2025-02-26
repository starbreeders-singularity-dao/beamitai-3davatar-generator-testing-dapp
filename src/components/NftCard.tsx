import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { BrowserProvider } from "ethers";
import abi from "../nftabi.json"


//const contractAddress = "0x28571421e389f0553b5c261dc33f7b22bbb1b0e3";

const useNFTs = ( contractAddress: string, userAddress: string) => {
  
  console.log("Contract Address:", contractAddress);
  console.log("User Address:", userAddress);

  const [nfts, setNFTs] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contractAddress || !userAddress) return;

    if (!(window as any).ethereum) {
      setError("No wallet detected. Please install MetaMask.");
      setLoading(false);
      return;
    }
    

    const fetchNFTs = async () => {
      try {
        setLoading(true);
        setError(null);

        // Connect to Ethereum provider
        //const provider = new ethers.providers.JsonRpcProvider("https://sepolia-rpc.scroll.io/")

        const provider = new BrowserProvider((window as any).ethereum);
        await provider.send("eth_requestAccounts", []); // Request wallet access

        const contract = new ethers.Contract(contractAddress, abi, provider);
        const balance = await contract.balanceOf(userAddress);

        const nftURIs: string[] = [];

        for (let i = 0; i < balance; i++) {
          const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
          const tokenURI = await contract.tokenURI(tokenId);
          nftURIs.push(tokenURI);
        }

        setNFTs(nftURIs);
      } catch (err: any) {
        console.error("Error fetching NFTs:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [contractAddress, userAddress]);

  return { nfts, loading, error };
};

export default useNFTs;
