import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import logo from '../images/beamit-ai-logo.png';
import '../App.css'; // Correct the path to App.css

function Web3Page() {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
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
    <div className="App">
      <header className="App-header">
        <img src={logo} alt="Beamit AI Logo" />
        <h1>Web3 Page</h1>
      </header>
      <div className="App-content">
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {account ? (
          <div>
            <p>Connected account: {account}</p>
            <p>Connection successful</p>
          </div>
        ) : (
          <p>Please connect your MetaMask wallet.</p>
        )}
      </div>
    </div>
  );
}

export default Web3Page; 