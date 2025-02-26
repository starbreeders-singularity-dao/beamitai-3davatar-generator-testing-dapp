import { useState } from "react";
import { ethers } from "ethers"; 
import eth from "../assets/eth.png";
import bsc from "../assets/bsc.png";
import scroll from "../assets/scroll.png";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (wallet: string) => void;
}

const WalletConnectModal: React.FC<WalletConnectModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [showWallets, setShowWallets] = useState<boolean>(false);

  if (!isOpen) return null;

  // Function to connect to MetaMask
  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []); // Request user accounts
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        console.log("Connected to MetaMask:", address);
        onConnect("MetaMask");
      } catch (error) {
        console.error("MetaMask connection error:", error);
      }
    } else {
      alert("MetaMask not installed");
    }
  };

  // Function to connect to Binance Smart Chain (BSC)
  const connectBSC = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x38" }], // Binance Smart Chain Mainnet
        });
        onConnect("Bsc Wallet");
      } catch (error) {
        console.error("BSC connection error:", error);
      }
    } else {
      alert("No compatible wallet found.");
    }
  };
  const connectScroll = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x82750" }], // Scroll Mainnet Chain ID
        });
        onConnect("Scroll");
      } catch (error: any) {
        // Scroll network is not added, add it
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x82750", // Scroll Mainnet
                  chainName: "Scroll Mainnet",
                  rpcUrls: ["https://rpc.scroll.io"], // RPC URL
                  nativeCurrency: {
                    name: "ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://scrollscan.com"],
                },
              ],
            });
            onConnect("Scroll");
          } catch (addError) {
            console.error("Error adding Scroll network:", addError);
          }
        } else {
          console.error("Error switching to Scroll network:", error);
        }
      }
    } else {
      alert("No compatible wallet found.");
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Connect Wallet</h2>

        {!showWallets ? (
          <>
            <button className="w-full py-2 mb-2 bg-gray-200 hover:bg-gray-300 rounded-lg" onClick={() => setShowWallets(true)}>
              Wallet Connect
            </button>

            <button className="w-full py-2 mb-2 flex items-center justify-center bg-pink-500 text-white hover:bg-black rounded-lg" onClick={connectScroll}>
              <img src={scroll} alt="scroll" className="w-6 h-6 mr-2" /> Scroll
            </button>
          </>
        ) : (
          <>
            <button className="w-full py-2 mb-2 flex items-center justify-center bg-pink-500 text-white hover:bg-black rounded-lg" onClick={connectMetaMask}>
              <img src={eth} alt="MetaMask" className="w-6 h-6 mr-2" /> MetaMask
            </button>
            <button className="w-full py-2 mb-2 flex items-center justify-center bg-pink-500 text-white hover:bg-black rounded-lg" onClick={connectBSC}>
              <img src={bsc} alt="bsc" className="w-6 h-6 mr-2" /> BSC Wallet
            </button>
          </>
        )}

        <button className="w-full py-2 bg-gray-500 text-white hover:bg-black rounded-lg" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default WalletConnectModal;
