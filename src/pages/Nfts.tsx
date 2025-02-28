// import Header from "../components/Header";


// const Nfts = () => {
//   return (
//     <div className="bg-black min-h-screen text-pink-500 p-6">
//       {/* Header */}
//       <Header />

//       <div className="flex gap-20 justify-center">
//         {/* Main Content */}
//         <div className="mt-8 flex flex-col items-center">
//           <h3 className="text-lg font-semibold mb-2">selected PFP</h3>
//           <div className="border border-cyan-400 w-60 h-60 flex items-center justify-center"></div>
//           <button className="mt-4 px-6 py-2 bg-pink-500 text-black rounded-lg hover:bg-black hover:text-pink-500 border border-pink-500 transition">Create full body image</button>
//         </div>
        
//        {/* NFT Grid */}
// <div className="mt-10 text-center">
//   <h3 className="text-lg font-semibold mb-4">Select your image to create an avatar</h3>
//   <div className="grid grid-cols-4 gap-4 justify-center">
//     {[...Array(8)].map((_, index) => (
//       <div key={index} className="flex flex-col items-center border border-cyan-400 w-32 h-32 p-2">
//         <div className="flex items-center justify-center flex-grow">
//           {/* NFT image will be dynamically inserted here */}
//         </div>
//         <p className="mt-2 text-sm">Bored Ape #{index + 10000}</p>
//         <button className="mt-2 px-4 py-2 border border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-black transition">
//           select
//         </button>
//       </div>
//     ))}
//   </div>
// </div>

//       </div>

//     </div>
//   );
// };

// export default Nfts;

import { useState, useEffect } from "react";
import Header from "../components/Header";
import useNFTs from "../components/NftCard";
import NFTCard from "../components/nftsDisplay"; 


const contractAddress = "0x28571421e389f0553b5c261dc33f7b22bbb1b0e3"; 

interface NFT {
  tokenId: string;
  metadata: { image: string };
}

const Nfts = () => {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  console.log("User Address:", userAddress);
  const { nfts, loading, error } = useNFTs(contractAddress, userAddress || "");

  
  
  
  console.log("NFTs Data:", nfts);
  console.log("Loading:", loading);
  console.log("Error:", error);

  const options = {method: 'GET', headers: {accept: 'application/json'}};

fetch('https://worldchain-mainnet.g.alchemy.com/v2/gBrRL8GNZB7bQQh-RXdd3W1rAal7R_M8/getNFTsForOwner?owner=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&withMetadata=true&pageSize=100', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));


  
  const mintNFT = async (nft: NFT) => {
    if (!userAddress) {
      console.error("Wallet not connected");
      return;
    }
  
    try {
      // 1️ Request signature from the backend
      const response = await fetch("https://your-backend.com/api/mint-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress,
          tokenId: nft.tokenId,
          uri: nft.metadata.image, // IPFS URL or image link
          originalContract: contractAddress,
          originalTokenId: nft.tokenId,
          chainId: 1, // Update with your network
        }),
      });
  
      const { signature, tokenId } = await response.json();
      console.log("Received Signature:", signature);
  
      // 2️ Call the smart contract mint function
      await mintOnBlockchain(tokenId, signature);
    } catch (error) {
      console.error("Error minting NFT:", error);
    }
  };
  
  const mintOnBlockchain = async (tokenId: string, signature: string) => {
    console.log(`Minting NFT ${tokenId} with signature ${signature}`);
    // TODO: Call smart contract mint function here
  };

  useEffect(() => {
    async function fetchUserAddress() {
      try {
        if ((window as any).ethereum) {
          const accounts = await (window as any).ethereum.request({
            method: "eth_requestAccounts",
          });
  
          if (accounts.length > 0) {
            console.log("User Address:", accounts[0]);
            setUserAddress(accounts[0]); // Set the user's wallet address
          } else {
            console.error("No accounts found. Please connect your wallet.");
          }
        } else {
          console.error("MetaMask not detected");
        }
      } catch (error) {
        console.error("Error fetching wallet:", error);
      }
    }
  
    fetchUserAddress();
  }, []);
  

  return (
    <div className="bg-black min-h-screen text-pink-500 p-6">
      <Header />

      <div className="flex gap-20 justify-center">
        {/* Main Content */}
        <div className="mt-8 flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-2">Selected PFP</h3>
          <div className="border border-cyan-400 w-60 h-60 flex items-center justify-center"></div>
          <button className="mt-4 px-6 py-2 bg-pink-500 text-black rounded-lg hover:bg-black hover:text-pink-500 border border-pink-500 transition">
            Create full-body image
          </button>
        </div>

        {/* NFT Grid */}
        <div className="mt-10 text-center">
          <h3 className="text-lg font-semibold mb-4">Select your image to create an avatar</h3>

          {loading && <p>Loading NFTs...</p>}
          {error && <p className="text-red-500">{error}</p>}

          <div className="grid grid-cols-4 gap-4 justify-center">
            {nfts.length > 0 ? (
              nfts.map((nft, index) => <NFTCard key={index} imageUrl={nft.metadata.image} index={index} />)
            ) : (
              <p>No NFTs found.</p>
            )}
          </div>
        </div>  

      </div>
    </div>
  );
};

export default Nfts;
