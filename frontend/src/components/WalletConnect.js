// src/components/WalletConnect.js
import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

function WalletConnect() {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      window.ethereum.enable().then(accounts => {
        setAccount(accounts[0]);
      }).catch(err => {
        console.error('Error enabling MetaMask:', err);
        setError('Failed to connect to MetaMask');
      });
    } else {
      alert('Please install MetaMask!');
    }
  }, []);

  return (
    <div>
      <h1>Wallet Connect</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {account ? (
        <div>
          <p>Connected account: {account}</p>
          <p>Wallet connected</p>
        </div>
      ) : (
        <p>Please connect your MetaMask wallet.</p>
      )}
    </div>
  );
}

export default WalletConnect;
