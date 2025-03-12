import React, { useEffect, useState } from 'react';
import './App.css';
import logo from './images/beamit-ai-logo.png';
import polygonIcon from './images/polygon.png';
import NFTMinter from './components/NFTMinter';
import NFTDisplay from './components/NFTDisplay';
import '@google/model-viewer/dist/model-viewer';

// Explicitly set environment variables on window for debugging
window.env = {
  REACT_APP_OPENSEA_API_KEY: process.env.REACT_APP_OPENSEA_API_KEY,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  REACT_APP_ALCHEMY_API_KEY: process.env.REACT_APP_ALCHEMY_API_KEY
};

console.log('Backend URL:', process.env.REACT_APP_API_URL);
console.log('Window env variables:', window.env);

function App() {
  useEffect(() => {
    console.log('All Environment Variables:', {
      openSeaKey: process.env.REACT_APP_OPENSEA_API_KEY,
      apiUrl: process.env.REACT_APP_API_URL,
      alchemyKey: process.env.REACT_APP_ALCHEMY_API_KEY,
      nodeEnv: process.env.NODE_ENV
    });
  }, []);

  useEffect(() => {
    console.log('Environment Variables:', {
      openSeaKey: process.env.REACT_APP_OPENSEA_API_KEY,
      apiUrl: process.env.REACT_APP_API_URL,
      alchemyKey: process.env.REACT_APP_ALCHEMY_API_KEY
    });
  }, []);

  useEffect(() => {
    console.log('OpenSea API Key:', process.env.REACT_APP_OPENSEA_API_KEY);
  }, []);

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
  const [selectedNFTName, setSelectedNFTName] = useState('');

  useEffect(() => {
    if (account) {
      fetchNFTs(account);
    }
  }, [account]);

  // WebSocket connection setup
  useEffect(() => {
    console.log('Setting up WebSocket connection...');
    const apiUrl = process.env.REACT_APP_API_URL || window.env.REACT_APP_API_URL || 'ws://localhost:5001';
    const wsUrl = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    console.log('Using WebSocket URL:', wsUrl);
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);

        if (data.type === 'glbReady') {
          console.log('GLB file is ready:', data);
          setGlbFileName(data.fileName);
          setGlbStatus('ready');
          setUploadStatus('3D Avatar Ready!');
          setShowMintButton(true);
          
          // Get signed URL for the GLB file
          fetch('http://localhost:5001/api/glb/signed-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              fileName: data.fileName 
            }),
          })
          .then(response => response.json())
          .then(data => {
            setGlbUrl(data.signedUrl);
          })
          .catch(error => {
            console.error('Error getting signed URL:', error);
            setModelViewerError('Failed to get GLB file URL');
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    // Cleanup on unmount
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

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
      setLoading(true);
      setStatusMessage('Fetching your NFTs...');
      
      // Get API key from environment, with fallback to window.env
      const apiKey = process.env.REACT_APP_OPENSEA_API_KEY || window.env.REACT_APP_OPENSEA_API_KEY || '80771966e5a44cf7b57fc18996193e8c';
      console.log('API Key check:', {
        exists: !!apiKey,
        length: apiKey?.length,
        value: apiKey ? apiKey.substring(0, 5) + '...' : 'Missing'
      });

      if (!apiKey) {
        throw new Error('OpenSea API key is missing. Please check your .env file.');
      }

      const chain = 'matic';
      const url = `https://api.opensea.io/api/v2/chain/${chain}/account/${walletAddress}/nfts`;
      
      const headers = {
        'X-API-KEY': apiKey,
        'accept': 'application/json'
      };
      
      console.log('Making request to:', url);
      console.log('With headers:', {
        ...headers,
        'X-API-KEY': headers['X-API-KEY'] ? headers['X-API-KEY'].substring(0, 5) + '...' : 'Missing'
      });
      
      const response = await fetch(url, { 
        headers,
        method: 'GET'
      });
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenSea API error:', {
          status: response.status,
          statusText: response.statusText,
          response: errorText,
          url,
          headers
        });
        throw new Error(`Failed to fetch NFTs: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('NFTs fetched:', data);
      
      if (!data.nfts || data.nfts.length === 0) {
        setStatusMessage('No NFTs found in your wallet');
        setNfts([]);
        return;
      }
      
      // Transform IPFS URLs to use a more reliable gateway
      const nftsWithProxiedUrls = data.nfts.map(nft => ({
        ...nft,
        image_url: nft.image_url?.replace('ipfs://', 'https://nftstorage.link/ipfs/')
          .replace('https://ipfs.io/ipfs/', 'https://nftstorage.link/ipfs/')
      }));
      
      setNfts(nftsWithProxiedUrls || []);
      setStatusMessage(`Found ${nftsWithProxiedUrls.length} NFTs`);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      setStatusMessage(`Error: ${error.message}`);
      setNfts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAvatar = async (imageUrl, nftName) => {
    // Transform URL to use a more reliable gateway
    const transformedUrl = imageUrl
      .replace('ipfs://', 'https://nftstorage.link/ipfs/')
      .replace('https://ipfs.io/ipfs/', 'https://nftstorage.link/ipfs/');
      
    console.log('Using transformed URL:', transformedUrl);
    setSelectedNFT(transformedUrl);
    setSelectedNFTName(nftName);
  };

  const handleBackButton = () => {
    setShowNFTGrid(true);
    setFullBodyImageUrl(null);
  };

  const handleGenerateFullBodyImage = async () => {
    if (!selectedNFT || !account) {
      alert('Please select an image and connect your wallet first.');
      return;
    }
    try {
      setLoading(true);
      setStatusMessage('Downloading PFP...');
      console.log('Starting download with NFT URL:', selectedNFT);

      const downloadResponse = await fetch('http://localhost:5001/save-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageUrl: selectedNFT,
          walletAddress: account,
          nftName: selectedNFTName
        }),
      });

      if (!downloadResponse.ok) {
        const errorText = await downloadResponse.text();
        console.error('Download failed:', {
          status: downloadResponse.status,
          statusText: downloadResponse.statusText,
          response: errorText
        });
        throw new Error(`Failed to download image: ${downloadResponse.statusText}`);
      }

      const downloadData = await downloadResponse.json();
      console.log('Image download success:', downloadData);
      setStatusMessage('Image Download Success');

      setStatusMessage('Generating Full Body Image...');
      console.log('Starting generation with filename:', downloadData.filename);

      const generateResponse = await fetch('http://localhost:5001/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageUrl: downloadData.filename,
          walletAddress: account
        }),
      });

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error('Generation failed:', {
          status: generateResponse.status,
          statusText: generateResponse.statusText,
          response: errorText
        });
        throw new Error(`Failed to generate full body image: ${generateResponse.statusText}`);
      }

      const generateData = await generateResponse.json();
      console.log('Full body image generated successfully:', generateData);
      
      // Use the imagePath directly as it already contains the full URL
      setFullBodyImageUrl(generateData.imagePath);
      
      setStatusMessage('Full Body Image Generated Successfully');
      setShowNFTGrid(false);
      setLoading(false);
    } catch (error) {
      console.error('Full error details:', error);
      setStatusMessage(error.message || 'Failed to generate full body image');
      setLoading(false);
    }
  };

  const handleBeamIt = async () => {
    if (!fullBodyImageUrl || !account) return;
  
    try {
      console.log('=== Starting Beam It Process ===');
      setUploadStatus('Processing your 3D Avatar...');
      const filename = fullBodyImageUrl.split('/').pop();
      const walletPrefix = account.toLowerCase().substring(2, 8);
      
      const response = await fetch('http://localhost:5001/upload-to-cloud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          fileName: filename,
          walletPrefix: walletPrefix
        }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          response: errorText
        });
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

  // Add effect to log state changes that affect view rendering
  useEffect(() => {
    console.log('View-related state updated:', {
      showNFTGrid,
      glbStatus,
      glbUrl,
      uploadStatus,
      showMintButton
    });
  }, [showNFTGrid, glbStatus, glbUrl, uploadStatus, showMintButton]);

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
                    <button onClick={() => handleCreateAvatar(nft.image_url, nft.name)} className="nft-button">
                      Choose PFP
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="pink-text">Please connect your MetaMask wallet to view your NFTs.</p>
            )}
          </div>
        ) : uploadStatus === 'Processing your 3D Avatar...' ? (
          <div className="model-container" style={{ textAlign: 'center', padding: '20px' }}>
            <h2 className="pink-text">Processing Your 3D Avatar</h2>
            <div className="loading">Processing...</div>
            <NFTDisplay walletPrefix={account ? account.toLowerCase().substring(2, 8) : null} />
          </div>
        ) : glbStatus === 'ready' && glbUrl ? (
          <div className="model-container">
            <h2 className="pink-text">Your 3D Avatar</h2>
            <div style={{
              position: 'relative',
              width: '800px',
              height: '800px',
              margin: '0 auto',
              backgroundColor: '#f5f5f5',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <div id="loading" 
                   style={{
                     position: 'absolute',
                     top: '50%',
                     left: '50%',
                     transform: 'translate(-50%, -50%)',
                     zIndex: 1,
                     background: 'rgba(0,0,0,0.7)',
                     color: 'white',
                     padding: '10px 20px',
                     borderRadius: '20px',
                     display: modelViewerError ? 'none' : 'block'
                   }}>
                Loading 3D Model...
              </div>
              
              {modelViewerError && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'red',
                  background: '#ffebee',
                  padding: '20px',
                  borderRadius: '8px',
                  maxWidth: '80%',
                  textAlign: 'center'
                }}>
                  Error loading model: {modelViewerError}
                </div>
              )}

              <model-viewer
                src={glbUrl}
                alt="3D Avatar"
                auto-rotate
                camera-controls
                camera-orbit="0deg 75deg 105%"
                min-camera-orbit="auto auto 50%"
                max-camera-orbit="auto auto 200%"
                camera-target="0m 1m 0m"
                field-of-view="30deg"
                environment-image="neutral"
                shadow-intensity="1"
                exposure="1"
                shadow-softness="1"
                interaction-prompt="auto"
                interaction-prompt-style="basic"
                interaction-prompt-threshold="0"
                auto-rotate-delay="0"
                rotation-per-second="30deg"
                min-field-of-view="25deg"
                max-field-of-view="45deg"
                interpolation-decay="200"
                loading="eager"
                reveal="auto"
                ar
                ar-modes="webxr scene-viewer quick-look"
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#f5f5f5',
                  '--poster-color': 'transparent',
                  '--progress-bar-color': '#FF1493',
                  '--progress-bar-height': '2px'
                }}
                onLoad={() => {
                  console.log('Model loaded successfully');
                  document.getElementById('loading').style.display = 'none';
                }}
                onError={(error) => {
                  console.error('Model viewer error:', error);
                  setModelViewerError(error.detail);
                }}
                onProgress={(event) => {
                  const percent = event.detail.totalProgress * 100;
                  const loading = document.getElementById('loading');
                  if (loading) {
                    loading.textContent = `Loading: ${percent.toFixed(0)}%`;
                  }
                }}
              >
                <div class="progress-bar hide" slot="progress-bar">
                  <div class="update-bar"></div>
                </div>
                <button slot="ar-button" style={{
                  background: '#FF1493',
                  border: 'none',
                  borderRadius: '4px',
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  color: 'white',
                  padding: '8px 16px'
                }}>
                  👀 View in AR
                </button>
              </model-viewer>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <NFTMinter 
                glbUrl={glbUrl}
                originalNFT={{
                  tokenId: "123",
                  chainId: 80002
                }}
                getSignedUrl={async () => {
                  try {
                    const response = await fetch('http://localhost:5001/api/glb/signed-url', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ 
                        fileName: glbFileName 
                      }),
                    });
                    
                    if (!response.ok) {
                      throw new Error('Failed to get signed URL');
                    }
                    
                    const data = await response.json();
                    return data.signedUrl;
                  } catch (error) {
                    console.error('Error getting signed URL:', error);
                    throw error;
                  }
                }}
              />
            </div>
          </div>
        ) : (
          <div className="full-body-container">
            <div className="full-body-header">
              <h2 className="pink-text">Your Full Body Image</h2>
            </div>
            
            <div className="full-body-image">
              {uploadStatus === 'Processing your 3D Avatar...' ? (
                <div className="model-container">
                  <div className="loading">Processing...</div>
                </div>
              ) : (
                <>
                  {fullBodyImageUrl && (
                    <div className="image-container">
                      <img 
                        src={fullBodyImageUrl} 
                        alt="Full Body" 
                        onError={(e) => {
                          console.error('Image load error:', e);
                          setStatusMessage('Error loading full body image');
                        }}
                      />
                    </div>
                  )}
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

export default App;
