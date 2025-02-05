import React, { useEffect, useState } from 'react';
import './App.css';
import logo from './images/beamit-ai-logo.png';
import polygonIcon from './images/polygon.png';
import NFTMinter from './components/NFTMinter';
import { ethers } from 'ethers';

console.log('Backend URL:', process.env.REACT_APP_API_URL);

function App() {
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [account, setAccount] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [fullBodyImageUrl, setFullBodyImageUrl] = useState(null);
  const [showNFTGrid, setShowNFTGrid] = useState(true);
  const [glbUrl, setGlbUrl] = useState(null);
  const [glbStatus, setGlbStatus] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [glbFileName, setGlbFileName] = useState(null);
  const [modelViewerError, setModelViewerError] = useState(null);
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

  const disconnectWallet = async () => {
    try {
      console.log('=== Starting Disconnect Process ===');
      
      const response = await fetch('http://localhost:5001/api/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Cleanup error details:', data);
        throw new Error(data.details || 'Cleanup failed');
      }

      console.log('Cleanup completed successfully');
      
      // Reset frontend state
      setAccount(null);
      setNfts([]);
      setSelectedNFT(null);
      setFullBodyImageUrl(null);
      setGlbUrl(null);
      setUploadStatus('');
      setGlbStatus(null);
      setGlbFileName(null);
      setModelViewerError(null);
      setShowNFTGrid(true);
      
      console.log('=== Disconnect Complete ===');
    } catch (error) {
      console.error('Error during disconnect:', error);
      alert(`Cleanup error: ${error.message}`);
    }
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
      setUploadStatus('Processing your 3D Avatar...');
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

  const checkGlbStatus = async () => {
    try {
      console.log('=== Checking GLB Status ===');
      const response = await fetch('http://localhost:5001/api/glb/status');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      console.log('GLB status response:', data);
      
      if (data.status === 'ready' && data.fileName) {
        const proxyUrl = `http://localhost:5001/proxy/glb`;
        console.log('Using proxy URL:', proxyUrl);

        setGlbUrl(proxyUrl);
        setGlbFileName(data.fileName);
        setGlbStatus('ready');
        setUploadStatus('3D Avatar Ready!');
      } else {
        console.log('Still processing GLB file');
      }
    } catch (error) {
      console.error('Error checking GLB status:', error);
      setModelViewerError(error.message);
    }
  };

  useEffect(() => {
    if (uploadStatus === 'Processing your 3D Avatar...') {
      const interval = setInterval(checkGlbStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [uploadStatus]);

  useEffect(() => {
    if (glbUrl) {
      console.log('Attempting to render model-viewer with URL:', glbUrl);
      fetch(glbUrl)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          console.log('GLB file is accessible');
        })
        .catch(error => {
          console.error('Error verifying GLB file:', error);
          setModelViewerError(`Failed to access GLB file: ${error.message}`);
        });
    }
  }, [glbUrl]);

  const handleMintNFT = async () => {
    console.log('Minting NFT...');
    // Minting logic will go here
  };

  useEffect(() => {
    console.log('Current state:', {
      uploadStatus,
      glbStatus,
      glbUrl
    });
  }, [uploadStatus, glbStatus, glbUrl]);

  useEffect(() => {
    console.log('3D Model State Update:', {
      glbStatus,
      glbUrl,
      glbFileName,
      uploadStatus,
      modelViewerError
    });
  }, [glbStatus, glbUrl, glbFileName, uploadStatus, modelViewerError]);

  useEffect(() => {
    if (!customElements.get('model-viewer')) {
      console.log('=== Loading Model Viewer Script ===');
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, []);

  const ModelViewer = ({ glbUrl }) => {
    useEffect(() => {
      console.log('ModelViewer mounted with URL:', glbUrl);
    }, [glbUrl]);

    return (
      <div className="model-viewer-container">
        <model-viewer
          src={glbUrl}
          alt="3D Avatar"
          camera-controls
          auto-rotate
          camera-orbit="0deg 75deg 105%"
          min-camera-orbit="auto auto 50%"
          max-camera-orbit="auto auto 200%"
          environment-image="neutral"
          exposure="1"
          shadow-intensity="1"
          shadow-softness="0"
          style={{
            width: '100%',
            height: '400px',
            backgroundColor: '#f5f5f5',
            '--progress-bar-height': '3px',
            '--progress-bar-color': '#4CAF50'
          }}
        >
          <div className="progress-bar hide" slot="progress-bar">
            <div className="update-bar"></div>
          </div>
          <div className="error" slot="error">
            Error loading model
          </div>
        </model-viewer>
      </div>
    );
  };

  const renderGLBViewer = () => {
    if (!glbUrl) return null;

    console.log('Rendering GLB viewer with URL:', glbUrl);
    
    return (
      <div className="glb-viewer-container">
        <h3>3D Avatar View</h3>
        <div className="model-viewer-wrapper">
          <ModelViewer glbUrl={glbUrl} />
        </div>
        <div className="debug-info">
          <p>Debug: GLB URL - {glbUrl}</p>
          <a href={glbUrl} target="_blank" rel="noopener noreferrer">
            Test GLB File
          </a>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (glbUrl) {
      setShowMintButton(true);
    }
  }, [glbUrl]);

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
              {uploadStatus === 'Processing your 3D Avatar...' || uploadStatus === '3D Avatar Ready!' ? (
                <div className="model-container">
                  {uploadStatus === 'Processing your 3D Avatar...' && (
                    <div className="loading">Processing...</div>
                  )}
                  {glbStatus === 'ready' && glbUrl && (
                    <>
                      <div style={{
                        position: 'relative',
                        width: '600px',
                        height: '600px',
                        margin: '0 auto'
                      }}>
                        {modelViewerError && (
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: '#FF1493',
                            textAlign: 'center',
                            padding: '20px',
                            background: 'rgba(0,0,0,0.8)',
                            borderRadius: '8px'
                          }}>
                            Error loading 3D model: {modelViewerError}
                          </div>
                        )}

                        <model-viewer
                          src={glbUrl}
                          alt="3D Avatar"
                          auto-rotate
                          camera-controls
                          camera-orbit="0deg 75deg 2.5m"
                          min-camera-orbit="auto auto 1.5m"
                          max-camera-orbit="auto auto 4m"
                          camera-target="0m -0.2m 0m"
                          bounds="tight"
                          field-of-view="30deg"
                          environment-image="neutral"
                          shadow-intensity="1"
                          exposure="1"
                          shadow-softness="1"
                          interaction-prompt="auto"
                          auto-rotate-delay="0"
                          rotation-per-second="30deg"
                          min-field-of-view="25deg"
                          max-field-of-view="45deg"
                          interpolation-decay="200"
                          loading="eager"
                          reveal="auto"
                          style={{
                            width: '600px', 
                            height: '600px', 
                            backgroundColor: '#e0e0e0',
                            border: '2px solid #FF1493',
                            transform: 'translateY(-15%)',
                            borderRadius: '8px'
                          }}
                          onLoad={() => {
                            console.log('=== Model Viewer Loaded ===');
                            console.log('Source URL:', glbUrl);
                            const modelViewer = document.querySelector('model-viewer');
                            console.log('Model loaded state:', modelViewer.loaded);
                          }}
                          onError={(error) => {
                            console.error('Model viewer error:', error);
                            console.error('Failed URL:', glbUrl);
                            console.error('Error details:', {
                              type: error.type,
                              detail: error.detail,
                              message: error.message
                            });
                            setModelViewerError(error.detail);
                          }}
                          onProgress={(event) => {
                            const progress = event.detail.totalProgress * 100;
                            console.log('Loading progress:', {
                              progress: progress.toFixed(2) + '%',
                              loaded: event.detail.loaded,
                              total: event.detail.total
                            });
                          }}
                        ></model-viewer>
                      </div>
                      {glbFileName && (
                        <div className="glb-info">
                          <p className="glb-filename">GLB File: {glbFileName}</p>
                          <p className="glb-url">URL: {glbUrl}</p>
                        </div>
                      )}
                      <button 
                        onClick={handleMintNFT} 
                        className="nft-button mint-button"
                        style={{ marginTop: '20px' }}
                      >
                        Mint NFT
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <h2>Full Body</h2>
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

      <div className="navigation-buttons">
        <button 
          className={`nav-button ${showNFTGrid ? 'active' : ''}`}
          onClick={() => {
            setShowNFTGrid(true);
            setFullBodyImageUrl(null);
            setGlbUrl(null);
            setUploadStatus('');
          }}
        >
          NFT Selection
        </button>
        <button 
          className={`nav-button ${(!showNFTGrid && fullBodyImageUrl && !glbUrl) ? 'active' : ''}`}
          onClick={() => {
            if (fullBodyImageUrl) {
              setShowNFTGrid(false);
              setGlbUrl(null);
              setUploadStatus('');
            }
          }}
        >
          Full Body Image
        </button>
        <button 
          className={`nav-button ${(!showNFTGrid && glbUrl) ? 'active' : ''}`}
          onClick={() => {
            if (glbUrl) {
              setShowNFTGrid(false);
              setUploadStatus('3D Avatar Ready!');
            }
          }}
        >
          3D Avatar View
        </button>
      </div>

      {glbUrl && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p>Debug: GLB URL</p>
          <a 
            href={glbUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#FF1493' }}
          >
            Test GLB File
          </a>
        </div>
      )}

      {showMintButton && (
        <NFTMinter 
          glbUrl={glbUrl}
          originalNFT={{
            tokenId: selectedNFT?.tokenId,
            chainId: selectedNFT?.chainId
          }}
        />
      )}
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

.glb-filename {
  margin-top: 10px;
  padding: 8px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-family: monospace;
}

.model-viewer-container {
  position: relative;
  width: 600px;
  height: 600px;
  margin: 0 auto;
}

.error-message {
  color: #ff4444;
  background: rgba(255, 0, 0, 0.1);
  padding: 10px;
  margin-top: 10px;
  border-radius: 4px;
  font-family: monospace;
}

.glb-info {
  margin: 15px 0;
  padding: 10px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.glb-filename {
  font-family: monospace;
  margin: 5px 0;
}

.glb-url {
  font-family: monospace;
  font-size: 0.8em;
  word-break: break-all;
  margin: 5px 0;
  color: #666;
}

.navigation-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 20px 0;
  padding: 10px;
  position: fixed;
  bottom: 20px;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.9);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.nav-button {
  background: transparent;
  color: white;
  border: 2px solid #FF1493;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  min-width: 150px;
}

.nav-button:hover {
  background: #FF1493;
  color: white;
  transform: translateY(-2px);
}

.nav-button.active {
  background: #FF1493;
  color: white;
}

.App-content {
  padding-bottom: 80px;
}
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default App;
