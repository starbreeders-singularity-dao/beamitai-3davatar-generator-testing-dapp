import React from 'react';

function AvatarSelection({ selectedNFT, handleGenerateImages, loading, dots }) {
  return (
    <div style={{ width: '40%', padding: '20px', boxSizing: 'border-box' }}>
      <h2>Your Avatar Selection</h2>
      <div style={{
        border: '1px solid #ff00ff',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center',
        minHeight: '400px',
      }}>
        {selectedNFT ? (
          <>
            <img
              src={selectedNFT}
              alt="Selected"
              style={{ width: '100%', height: 'auto', maxWidth: '400px', maxHeight: '400px' }}
            />
            <button className="App-link" onClick={handleGenerateImages} style={{ marginTop: '20px' }}>
              Create full body image
            </button>
            {loading && <p>Generating{dots}</p>}
          </>
        ) : (
          <p>Please select an image to create your avatar.</p>
        )}
      </div>
    </div>
  );
}

export default AvatarSelection;
