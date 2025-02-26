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

const Nfts = () => {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  console.log("User Address:", userAddress);
  const { nfts, loading, error } = useNFTs(contractAddress, userAddress || "");
  
  console.log("NFTs Data:", nfts);
  console.log("Loading:", loading);
  console.log("Error:", error);




  // useEffect(() => {
  //   async function fetchUserAddress() {
  //     if ((window as any).ethereum) {
  //       const accounts = await (window as any).ethereum.request({
  //         method: "eth_requestAccounts",
  //       });
  //       setUserAddress(accounts[0]); // Set the user's wallet address
  //     }
  //   }

  //   fetchUserAddress();
  // }, []);
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
              nfts.map((nft, index) => <NFTCard key={index} imageUrl={nft} index={index} />)
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
