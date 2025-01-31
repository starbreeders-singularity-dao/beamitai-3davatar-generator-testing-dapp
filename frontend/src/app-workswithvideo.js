import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
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
  const [fullBodyImageUrl, setFullBodyImageUrl] = useState(null);
  const [showNFTGrid, setShowNFTGrid] = useState(true);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoStatus, setVideoStatus] = useState('processing');
  const [uploadStatus, setUploadStatus] = useState('');
  const [showMintButton, setShowMintButton] = useState(false);

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
      setNfts(data.nfts || []);
    } catch (error) {
      console.error("Error fetching NFTs", error);
    }
  };

  const handleCreateAvatar = async (imageUrl) => {
    setSelectedNFT(imageUrl);
  };

  const handleBackButton = () => {
    setShowNFTGrid(true);
    setFullBodyImageUrl(null);
  };

  const handleGenerateFullBodyImage = async () => {
    if (!selectedNFT) {
      alert('Please select an image first.');
      return;
    }
    try {
      setLoading(true);
      setStatusMessage('Downloading PFP...');

      const downloadResponse = await fetch('http://localhost:5001/save-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageUrl: selectedNFT
        }),
      });

      if (!downloadResponse.ok) {
        const errorText = await downloadResponse.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to download image');
      }

      const downloadData = await downloadResponse.json();
      console.log('Image download success');
      setStatusMessage('Image Download Success');

      setStatusMessage('Generating Full Body Image...');
      const generateResponse = await fetch('http://localhost:5001/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageUrl: downloadData.filename 
        }),
      });

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to generate full body image');
      }

      const data = await generateResponse.json();
      console.log('Full body image generated:', data);
      setFullBodyImageUrl(data.imagePath);
      setStatusMessage('Full Body Image Generated Successfully');
      setShowNFTGrid(false);
      setLoading(false);
    } catch (error) {
      console.error('Error generating full body image:', error);
      setStatusMessage('Failed to generate full body image');
      setLoading(false);
    }
  };

  const handleBeamIt = async () => {
    if (!fullBodyImageUrl) return;
  
    try {
      setUploadStatus('Uploading...');
      const filename = fullBodyImageUrl.split('/').pop();
      
      const response = await fetch('http://localhost:5001/upload-to-cloud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          fileName: filename 
        }),
      });
  
      if (!response.ok) {
        throw new Error('Upload failed');
      }
  
      const data = await response.json();
      console.log('Upload success:', data);
      setUploadStatus('Processing your 3D Avatar...');
      
    } catch (error) {
      console.error('Error uploading to cloud:', error);
      setUploadStatus('Failed to beam to cloud');
    }
  };

  const checkVideoStatus = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/videos/status');
      const data = await response.json();
      if (data.signedUrl) {
        setVideoUrl(data.signedUrl);
        setVideoStatus('ready');
      }
    } catch (error) {
      console.error('Error checking video status:', error);
    }
  };

  useEffect(() => {
    if (uploadStatus === 'Processing your 3D Avatar...') {
      const interval = setInterval(checkVideoStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [uploadStatus]);

  const handleMintNFT = async () => {
    console.log('Minting NFT...');
    // Minting logic will go here
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
              <p className="status-message">{statusMessage}</p>
              {loading && <div className="loading-dots">...</div>}
            </div>
          )}
        </div>
        
        {showNFTGrid ? (
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
        ) : (
          <div className="full-body-container">
            <div className="full-body-header">
              <h2 className="pink-text">Your Full Body Image</h2>
            </div>
            
            <div className="full-body-image">
              {uploadStatus === 'Processing your 3D Avatar...' ? (
                <div className="video-container">
                  {videoUrl ? (
                    <>
                      <video width="600" controls>
                        <source src={videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      <button 
                        onClick={handleMintNFT} 
                        className="nft-button mint-button"
                        style={{ marginTop: '20px' }}
                      >
                        Mint NFT
                      </button>
                    </>
                  ) : (
                    <p>Processing your avatar... Please wait.</p>
                  )}
                </div>
              ) : (
                <>
                  <img src={fullBodyImageUrl} alt="Full Body" />
                  <div className="button-group">
                    <button onClick={handleBackButton} className="nft-button">Back to NFT Selection</button>
                    <button onClick={handleBeamIt} className="nft-button beam-button">Beam It!</button>
                  </div>
                </>
              )}
            </div>
            
            {uploadStatus && <p className="status-message">{uploadStatus}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = `
.mint-button {
  background: linear-gradient(45deg, #FF1493, #FF69B4);
  color: white;
  font-weight: bold;
  padding: 12px 24px;
  border-radius: 25px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mint-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 20, 147, 0.3);
}
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default App;
