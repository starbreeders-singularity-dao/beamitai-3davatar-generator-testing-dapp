import React, { useEffect, useState } from 'react';
import './App.css';
import logo from './images/beamit-ai-logo.png';
import polygonIcon from './images/polygon.png';
import NFTMinter from './components/NFTMinter';
import NFTDisplay from './components/NFTDisplay';
import '@google/model-viewer/dist/model-viewer';
import GlbViewer from './components/GlbViewer';
import TestMintPage from './components/TestMintPage';

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
  const [showTestMintPage, setShowTestMintPage] = useState(false);

  useEffect(() => {
    if (account) {
      fetchNFTs(account);
    }
  }, [account]);

  // WebSocket connection setup
  useEffect(() => {
    console.log('Setting up WebSocket connection...');
    const wsUrl = 'ws://localhost:5001';  // Fixed WebSocket URL
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
          setGlbUrl(`http://localhost:5001/glb/${data.fileName}`);
          setShowMintButton(true);
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

      // Log the request payload
      const payload = { 
        imageUrl: selectedNFT,
        walletAddress: account,
        nftName: selectedNFTName
      };
      console.log('Sending request payload:', payload);

      const downloadResponse = await fetch('http://localhost:5001/save-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Log the raw response
      console.log('Download Response:', {
        status: downloadResponse.status,
        statusText: downloadResponse.statusText,
        headers: Object.fromEntries(downloadResponse.headers.entries())
      });

      // Try to get response text first
      const responseText = await downloadResponse.text();
      console.log('Raw response text:', responseText);

      if (!downloadResponse.ok) {
        console.error('Download failed:', {
          status: downloadResponse.status,
          statusText: downloadResponse.statusText,
          response: responseText
        });
        throw new Error(`Failed to download image: ${downloadResponse.statusText}`);
      }

      // Try to parse the response as JSON
      let downloadData;
      try {
        downloadData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Invalid response from server');
      }

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

      // Log the raw generate response
      console.log('Generate Response:', {
        status: generateResponse.status,
        statusText: generateResponse.statusText,
        headers: Object.fromEntries(generateResponse.headers.entries())
      });

      const generateResponseText = await generateResponse.text();
      console.log('Raw generate response text:', generateResponseText);

      if (!generateResponse.ok) {
        console.error('Generation failed:', {
          status: generateResponse.status,
          statusText: generateResponse.statusText,
          response: generateResponseText
        });
        throw new Error(`Failed to generate full body image: ${generateResponse.statusText}`);
      }

      // Try to parse generate response as JSON
      let generateData;
      try {
        generateData = JSON.parse(generateResponseText);
      } catch (e) {
        console.error('Failed to parse generate response as JSON:', e);
        throw new Error('Invalid response from generate server');
      }

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
      setShowNFTGrid(false); // Hide NFT grid when starting the beam process
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
      setShowNFTGrid(true); // Show NFT grid again if there's an error
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

      <div className="App-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ 
          color: '#00ffff', 
          textAlign: 'center', 
          marginBottom: '20px',
          width: '100%',
          padding: '20px 0',
          marginTop: '20px'
        }}>
          {!account 
            ? "3D Avatar Generator - Connect Your Scroll Wallet to Teleport!" 
            : glbStatus === 'ready' && glbUrl
              ? "Fabulous! Now mint your NFT on scroll testnet and load it into any compatible Metaverse!"
              : fullBodyImageUrl 
                ? "Great! Now click Beamit! to 3D-fi your Avatar!" 
                : "First: let's generate a FullBody Image from your PFP"}
        </h1>
        
        {showTestMintPage ? (
          <TestMintPage />
        ) : (
          <div style={{ width: '100%', marginTop: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '30px', flexWrap: 'nowrap' }}>
              <div className="avatar-selection" style={{ flex: '0 0 300px' }}>
                <h2 className="pink-text">Your Avatar Selection</h2>
                {selectedNFT && (
                  <div>
                    <img src={selectedNFT} alt="Selected NFT" className="selected-nft" />
                    <button className="nft-button" onClick={handleGenerateFullBodyImage}>
                      {loading ? 'Generating...' : 'Create Full Body Image'}
                    </button>
                    <p className="status-message">{loading ? statusMessage : "Note: This will take up to 35 sec!"}</p>
                    {loading && <div className="loading-dots">...</div>}
                  </div>
                )}
              </div>
              
              {showNFTGrid ? (
                <div className="nft-gallery-container" style={{ flex: '1' }}>
                  <h2 className="pink-text">Please select an image to create your avatar</h2>
                  {account ? (
                    <div className="nft-gallery" style={{ 
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      gap: '20px',
                      padding: '20px'
                    }}>
                      {nfts.map((nft, index) => (
                        <div key={index} className="nft-item" style={{
                          border: '1px solid #ff00ff',
                          borderRadius: '8px',
                          padding: '15px',
                          textAlign: 'center',
                          background: 'black',
                          color: 'white',
                          width: '190px',  // Reduced from 200px
                          flexShrink: 0
                        }}>
                          <img src={nft.image_url} alt={nft.name} style={{ 
                            width: '142px',  // Reduced from 150px
                            height: '142px',  // Reduced from 150px
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }} />
                          <p style={{ margin: '10px 0' }}>{nft.name}</p>
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
                  <div className="loading" style={{ color: '#00ffff', fontWeight: 'bold' }}>Processing...</div>
                  <p style={{ color: '#00ffff' }}>{uploadStatus}</p>
                  <div style={{ color: '#00ffff' }}>
                    <NFTDisplay walletPrefix={account ? account.toLowerCase().substring(2, 8) : null} />
                  </div>
                </div>
              ) : glbStatus === 'ready' && glbUrl ? (
                <div className="model-container" style={{
                  border: '1px solid #ff00ff',
                  borderRadius: '8px',
                  padding: '20px',
                  background: 'black'
                }}>
                  <h2 className="pink-text">Your 3D Avatar</h2>
                  <div style={{
                    position: 'relative',
                    width: '400px',
                    height: '400px',
                    margin: '0 auto',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    border: '2px solid #ff00ff',
                    padding: '4px'
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
                      <div className="progress-bar hide" slot="progress-bar">
                        <div className="update-bar"></div>
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
                    <style>
                      {`
                        .mint-nft-button {
                          background-color: black !important;
                          color: #ff00ff !important;
                          font-weight: bold !important;
                          border: 2px solid #ff00ff !important;
                        }
                      `}
                    </style>
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
        )}
      </div>
      <GlbViewer />
    </div>
  );
}

export default App;
