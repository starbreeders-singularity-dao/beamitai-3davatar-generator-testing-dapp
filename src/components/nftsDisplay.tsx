import React from "react";

interface NFTCardProps {
  imageUrl: string;
  index: number;
}

const NFTCard: React.FC<NFTCardProps> = ({ imageUrl, index }) => {
  return (
    <div className="flex flex-col items-center border border-cyan-400 w-32 h-32 p-2">
      <div className="flex items-center justify-center flex-grow">
        <img src={imageUrl} alt={`NFT ${index}`} className="w-full h-full object-cover" />
      </div>
      <button className="mt-2 px-4 py-2 border border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-black transition">
        Select
      </button>
    </div>
  );
};

export default NFTCard;
