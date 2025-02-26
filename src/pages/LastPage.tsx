import React from "react";
import Header from "../components/Header";
import Button from "../components/Button";

const LastPage: React.FC = () => {
  return (
    <div className="bg-black text-pink-500 min-h-screen flex flex-col items-center">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex flex-col items-center mt-10">
        {/* Heading */}
        <h3 className="text-pink-500 text-lg font-semibold text-center mb-4">
          Your 3D Avatar is Ready!!!
        </h3>

        {/* NFT Display Box */}
        <div className="border border-blue-300 w-50 h-50 flex items-center justify-center">
          num {/* This will be replaced with the fetched NFT */}
        </div>

        {/* Connect Wallet Button */}
        <Button className="mt-6 px-6 py-2 bg-pink-500 text-black rounded-lg">
          Connect Wallet
        </Button>
      </div>
    </div>
  );
};

export default LastPage;
