import React, { useState, useEffect } from 'react';
import './App.css';  // Reuse the same styling

function AppResult() {
  const [glbUrl, setGlbUrl] = useState(null);
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState(null);
  const [fullBodyImage, setFullBodyImage] = useState(null);

  useEffect(() => {
    // Get the image URL from the URL parameters
    const params = new URLSearchParams(window.location.search);
    const imageUrl = params.get('image');
    if (imageUrl) {
      setFullBodyImage(imageUrl);
    }

    // Start checking for GLB file
    const interval = setInterval(checkGlbStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkGlbStatus = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/model/status');
      const data = await response.json();
      
      console.log('Status check response:', data);
      
      if (data.status === 'ready' && data.signedUrl) {
        setGlbUrl(data.signedUrl);
        setProcessing(false);
      }
    } catch (error) {
      console.error('Error checking GLB status:', error);
      setError('Error loading 3D model');
    }
  };

  const handleMintNFT = () => {
    // Implement NFT minting logic
    console.log('Minting NFT...');
  };

  return (
    <div className="app">
      <div className="container">
        <h1>Your 3D Avatar Result</h1>
        
        <div className="result-container" style={{ display: 'flex', justifyContent: 'space-between' }}>
          {/* Left side - Full Body Image */}
          <div className="image-container" style={{ flex: 1, marginRight: '20px' }}>
            <h2>Original Image</h2>
            {fullBodyImage && (
              <img 
                src={fullBodyImage} 
                alt="Full Body" 
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            )}
          </div>

          {/* Right side - 3D Model */}
          <div className="model-container" style={{ flex: 1 }}>
            <h2>3D Avatar</h2>
            {processing ? (
              <div className="loading-container">
                <p>Processing your 3D Avatar...</p>
                <div className="loading-spinner"></div>
              </div>
            ) : error ? (
              <p className="error-message">{error}</p>
            ) : glbUrl ? (
              <>
                <model-viewer
                  src={glbUrl}
                  alt="3D Avatar"
                  auto-rotate
                  camera-controls
                  style={{ width: '100%', height: '600px' }}
                ></model-viewer>
                <button
                  onClick={handleMintNFT}
                  className="nft-button mint-button"
                  style={{ marginTop: '20px' }}
                >
                  Mint NFT
                </button>
              </>
            ) : (
              <p>No 3D Avatar available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppResult;
