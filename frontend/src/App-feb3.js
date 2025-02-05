import React, { useState } from 'react';
import NFTMinter from './components/NFTMinter';
import '@google/model-viewer/dist/model-viewer';
import './App.css';

function App() {
  const testGlbUrl = "http://localhost:5001/test-glb";
  const [modelViewerError, setModelViewerError] = useState(null);

  return (
    <div className="App">
      <h1>Beamit AI NFT Minter Test</h1>
      
      {/* 3D Model Viewer */}
      <div style={{
        position: 'relative',
        width: '600px',
        height: '600px',
        margin: '0 auto'
      }}>
        <model-viewer
          src={testGlbUrl}
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
          onError={(error) => {
            console.error('Model viewer error:', error);
            setModelViewerError(error.detail);
          }}
        />
      </div>

      {/* Debug Info */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p>Debug Information</p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <a 
            href={testGlbUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#FF1493' }}
          >
            Test GLB File
          </a>
          
          {modelViewerError && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              Model Viewer Error: {modelViewerError}
            </div>
          )}
          
          <div>
            Collection ID: {localStorage.getItem('beamitCollectionId') || 'Not created yet'}
          </div>
        </div>
      </div>

      {/* NFT Minter */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <NFTMinter 
          glbUrl={testGlbUrl}
          originalNFT={{
            tokenId: "123",
            chainId: 80002
          }}
        />
      </div>
    </div>
  );
}

export default App;
