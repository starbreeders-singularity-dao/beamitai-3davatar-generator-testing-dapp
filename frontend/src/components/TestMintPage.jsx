import React, { useEffect, useState } from 'react';
import '@google/model-viewer/dist/model-viewer';
import NFTMinter from './NFTMinter';

function TestMintPage() {
  const [glbUrl, setGlbUrl] = useState(null);
  const [glbFileName, setGlbFileName] = useState(null);
  const [modelViewerError, setModelViewerError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch test GLB file on component mount
    fetch('http://localhost:5001/api/test/glb-for-mint')
      .then(response => response.json())
      .then(data => {
        if (data.status === 'ready') {
          setGlbUrl(data.url);
          setGlbFileName(data.fileName);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching test GLB:', error);
        setModelViewerError('Failed to fetch GLB file');
        setLoading(false);
      });
  }, []);

  return (
    <div className="test-mint-page">
      <h1 style={{ textAlign: 'center', color: '#FF1493' }}>Test NFT Mint Page</h1>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading GLB file...</div>
      ) : glbUrl ? (
        <div className="model-container">
          <div style={{
            position: 'relative',
            width: '400px',
            height: '400px',
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
        <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
          {modelViewerError || 'No GLB file available'}
        </div>
      )}
    </div>
  );
}

export default TestMintPage; 