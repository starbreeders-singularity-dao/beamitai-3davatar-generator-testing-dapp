import React from 'react';

function ImageGallery({ generatedImages, localImages, handleCreateAvatar, handleBeamit, handleBack, uploadStatus }) {
  return (
    <div style={{ width: '60%', padding: '20px' }}>
      {generatedImages.length === 0 ? (
        <>
          <h2>Local Images</h2>
          {localImages.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {localImages.map((imageUrl, index) => (
                <div key={index} style={{ width: '25%', padding: '10px' }}>
                  <div style={{ border: '1px solid #ff00ff', padding: '10px', textAlign: 'center' }}>
                    <img
                      src={imageUrl}
                      alt={`Local Image ${index}`}
                      style={{ width: '100%', height: 'auto' }}
                    />
                    <button className="App-link" onClick={() => handleCreateAvatar(imageUrl)}>
                      Choose PFP
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No local images found.</p>
          )}
        </>
      ) : (
        <div
          id="generated-image-section"
          style={{ border: '1px solid #ff00ff', padding: '20px', borderRadius: '8px', textAlign: 'center', maxWidth: '400px' }}
        >
          <h2>Full Body Image</h2>
          {generatedImages.map((imgUrl, index) => (
            <img
              key={index}
              src={imgUrl}
              alt={`Generated ${index}`}
              style={{ width: '100%', height: 'auto' }}
            />
          ))}
          <div style={{ marginTop: '10px' }}>
            <button className="App-link" onClick={handleBeamit}>BEAMIT!</button>
            <button className="App-link" onClick={handleBack} style={{ marginLeft: '10px' }}>Back</button>
          </div>
          {uploadStatus && <p>{uploadStatus}</p>}
        </div>
      )}
    </div>
  );
}

export default ImageGallery;
