import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import AvatarSelection from './components/AvatarSelection';
import './App.css';
import logo from './images/beamit-ai-logo.png';
import polygonIcon from './images/polygon.png';

console.log('Backend URL:', process.env.REACT_APP_API_URL);

function App() {
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [account, setAccount] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (account) {
      fetchNFTs(account);
    }
  }, [account]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Error connecting to MetaMask", error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setNfts([]);
  };

  const fetchNFTs = async (walletAddress) => {
    try {
      const apiKey = process.env.REACT_APP_OPENSEA_API_KEY;
      const chain = 'matic';
      const response = await fetch(`https://api.opensea.io/api/v2/chain/${chain}/account/${walletAddress}/nfts`, {
        headers: {
          'X-API-KEY': apiKey,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('NFT Data:', data);
      setNfts(data.nfts || []);
    } catch (error) {
      console.error("Error fetching NFTs", error);
    }
  };

  const handleCreateAvatar = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'pfpImage.png', { type: 'image/png' });

      const formData = new FormData();
      formData.append('pfpImage', file);

      const saveResponse = await fetch('/save-image', {
        method: 'POST',
        body: formData,
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save image');
      }

      console.log('Image saved successfully');
      setSelectedNFT(imageUrl);
    } catch (error) {
      console.error('Error saving image:', error);
    }
  };

  const handleGenerateFullBodyImage = async () => {
    if (!selectedNFT) {
      alert('Please select an image first.');
      return;
    }
    try {
      setLoading(true);
      setStatusMessage('Your PFP is sent to AI model...');
      const response = await fetch('/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: selectedNFT }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate full body image');
      }

      const data = await response.json();
      console.log('Full body image generated:', data);
      setStatusMessage('Your full body image is generated');
      setLoading(false);
    } catch (error) {
      console.error('Error generating full body image:', error);
      setStatusMessage('Error generating full body image');
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} alt="Beamit AI Logo" style={{ maxWidth: '250px', marginLeft: '20px' }} />
        <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={connectWallet} className="wallet-button">
            {account ? 'Wallet Connected' : 'Connect Wallet'}
          </button>
          {account && <button onClick={disconnectWallet} className="wallet-button">Disconnect</button>}
          <img src={polygonIcon} alt="Polygon Icon" style={{ width: '30px' }} />
        </div>
      </header>

      <div className="App-content">
        <div className="avatar-selection">
          <h2 className="pink-text">Your Avatar Selection</h2>
          {selectedNFT && (
            <div>
              <img src={selectedNFT} alt="Selected NFT" className="selected-nft" />
              <button className="nft-button" onClick={handleGenerateFullBodyImage}>
                {loading ? 'Generating...' : 'Create Full Body Image'}
              </button>
              <p>{statusMessage}</p>
            </div>
          )}
        </div>
        <div className="nft-gallery-container">
          <h2 className="pink-text">Please select an image to create your avatar</h2>
          {account ? (
            <div className="nft-gallery">
              {nfts.map((nft, index) => (
                <div key={index} className="nft-item">
                  <img src={nft.image_url} alt={nft.name} style={{ width: '100px' }} />
                  <p>{nft.name}</p>
                  <button onClick={() => handleCreateAvatar(nft.image_url)} className="nft-button">Choose PFP</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="pink-text">Please connect your MetaMask wallet to view your NFTs.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;