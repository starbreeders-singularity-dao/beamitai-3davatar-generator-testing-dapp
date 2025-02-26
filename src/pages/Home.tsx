import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import { ethers } from "ethers";

const Home: React.FC = () => {
  const [userAddress, setUserAddress] = useState<string | null>(null);


  useEffect(() => {
    // Check if wallet is already connected
    const checkWalletConnection = async () => {
      if ((window as any).ethereum) {
        try {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const accounts = await provider.listAccounts(); // Get connected accounts
          if (accounts.length > 0) {
            setUserAddress(accounts[0].address); // Set user address
          }
        } catch (err) {
          console.error("Error checking wallet connection:", err);
        }
      }
    };
    checkWalletConnection();
  }, []);

  
  const connectWallet = async () => {
    try {
      if (!(window as any).ethereum) {
        alert("No wallet found. Please install MetaMask.");
        return;
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setUserAddress(accounts[0]);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  return (
    <div className="bg-black text-pink-500 min-h-screen flex flex-col items-center">
      {/* Header */}
      <Header />
  
      {/* Main Content */}
      <div className="flex flex-col items-center mt-10 w-full px-6">
        <h3 className="text-pink-500 text-lg font-semibold text-center mb-4">
          Beam your PFP into a 3D Avatar
        </h3>
  
        {/* Box with Cyan Border */}
        <div className="w-60 max-w-md h-60 border-2 border-cyan-500 flex items-center justify-center mb-6 rounded-lg">
          <p className="text-gray-400 text-center">Your NFTs will appear here</p>
        </div>
  
        {/* Wallet Status */}
        {!userAddress ? (
          <button onClick={connectWallet} className="mt-6 px-6 py-2 bg-pink-500 text-black rounded-lg hover:bg-pink-600">
            Connect Wallet
          </button>
        ) : (
          <p className="mt-4 text-center">Connected: {userAddress}</p>
        )}
      </div>
    </div>
  );
};

export default Home;
