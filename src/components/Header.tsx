import React, { useState } from "react";
import logo from "../assets/Rectangle.png";
import Button from "./Button";
import { DiscoverWalletProviders } from "./DiscoverWalletProviders";
import { useWallet } from "../context/WalletContext";


const Header: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const { walletAddress, setWalletAddress } = useWallet();

  const handleDisconnect = () => {
    setWalletAddress(null);
    setIsModalOpen(false);
  };
  return (
    <header className="flex justify-between items-center w-full px-10 py-4">
      {/* Logo */}
      <div className="text-2xl font-bold">
        <img src={logo} alt="logo" />
      </div>
  
      {/* Wallet Connect Button */}
      {/* <Button
        className="px-2 py-2 bg-pink-500 text-white hover:bg-black w-40 h-10"
        onClick={() => setIsModalOpen(true)} // Open the modal
      >
        Connect Wallet
      </Button> */}

      {walletAddress ? (
        <div className="flex items-center space-x-4">
          <span className="text-white">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
          <Button className="px-2 py-2 bg-red-500 text-white hover:bg-black w-40 h-10" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </div>
      ) : (
        <Button className="px-2 py-2 bg-pink-500 text-white hover:bg-black w-40 h-10" onClick={() => setIsModalOpen(true)}>
          Connect Wallet
        </Button>
      )}
  
      {/* Render WalletConnect Modal when isModalOpen is true */}
      {isModalOpen && <DiscoverWalletProviders onClose={() => setIsModalOpen(false)} />}
    </header>
  );
  
};

export default Header;
