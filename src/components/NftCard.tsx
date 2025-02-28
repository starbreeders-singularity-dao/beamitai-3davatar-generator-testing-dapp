import { useState, useEffect } from "react";
import { ethers } from "ethers";
import abi from "../nftabi.json";
import axios from "axios"; // For Alchemy API calls

const contractAddress = "0x28571421e389f0553b5c261dc33f7b22bbb1b0e3";
const alchemyApiKey = "gBrRL8GNZB7bQQh-RXdd3W1rAal7R_M8";
const alchemyBaseUrl = "https://eth-mainnet.g.alchemy.com/v2/";

interface NFT {
  tokenId: string;
  contractAddress: string;
  metadata: any;
  image: string;
}

const useNFTs = (contractAddress: string, userAddress: string | null) => {
  const [nfts, setNFTs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [userAddr, setUserAddr] = useState<string | null>(userAddress);



  // Connect Wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("No wallet detected. Please install MetaMask.");
      return;
    }
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);

      const signer = await web3Provider.getSigner();
      setSigner(signer);
      setUserAddr(await signer.getAddress());
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      setError(err.message);
    }
  };

  useEffect(() => {
    connectWallet();
  }, []);

  // Fetch NFTs using Alchemy API
  const fetchNFTs = async () => {
    if (!userAddress) return;
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${alchemyBaseUrl}${alchemyApiKey}/getNFTs?owner=${userAddress}`
      );

      const nftData = response.data.ownedNfts.map((nft: any) => ({
        tokenId: nft.id.tokenId,
        contractAddress: nft.contract.address,
        metadata: nft.metadata,
        image: nft.metadata && nft.metadata.image ? nft.metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/") : "",
      }));

      setNFTs(nftData);
    } catch (err: any) {
      console.error("Error fetching NFTs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNFTs();
  }, [userAddress]);

  return { nfts, loading, error, status, message, setMessage, connectWallet, userAddress };
};

export default useNFTs;
