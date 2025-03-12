import React from 'react';

const NFTDisplay = ({ walletPrefix }) => {
  return (
    <div className="nft-display">
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Processing your 3D Avatar...</p>
        <p className="wallet-prefix">Wallet Prefix: {walletPrefix}</p>
      </div>
    </div>
  );
};

export default NFTDisplay; 