import React, { useEffect, useState } from 'react';

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pfpFile, setPfpFile] = useState(null);
  const [localImages, setLocalImages] = useState([]); // State for local images

  const backendUrl = 'http://localhost:5001'; // Backend URL

  // Connect to the wallet
  useEffect(() => {
    const connectWallet = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
          });
        } catch (error) {
          console.error('Error connecting to wallet:', error);
        }
      } else {
        console.error('No Ethereum provider found');
      }
    };

    connectWallet();
  }, []);

  // Fetch images from the backend 'pfp' folder
  useEffect(() => {
    const fetchLocalImages = async () => {
      try {
        const response = await fetch(`${backendUrl}/pfp`);
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const fullImagePaths = data.images.map(img => `${backendUrl}${img}`);
        console.log("Fetched local images:", fullImagePaths); // Debugging: Log the local images
        setLocalImages(fullImagePaths);
      } catch (error) {
        console.error('Error fetching local images:', error.message);
      }
    };

    fetchLocalImages();
  }, []);

  const handleCreateAvatar = (imageUrl, isNFT = false) => {
    setSelectedNFT(imageUrl);
    setGeneratedImages([]);
    fetch(imageUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], isNFT ? 'pfpImage.jpg' : 'localImage.jpg', { type: blob.type });
        setPfpFile(file);
      })
      .catch((err) => {
        console.error('Error fetching image:', err);
        alert('Failed to load image.');
      });
  };

  const handleGenerateImages = async () => {
    if (!selectedNFT) {
      alert('Please select an image first.');
      return;
    }

    if (!pfpFile) {
      alert('Profile picture image is required.');
      return;
    }

    try {
      setLoading(true);
      setGeneratedImages([]);

      const formData = new FormData();
      formData.append('pfpImage', pfpFile);

      const response = await fetch(`${backendUrl}/generate-images`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error generating images: ${errorData.error}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log("Image path returned from backend:", data.imagePath);  // Debugging: Log the generated image path
      setGeneratedImages([`${data.imagePath}`]);
      setLoading(false);
    } catch (error) {
      alert(`Error generating images: ${error.message}`);
      setLoading(false);
    }
  };

  const handleBeamit = () => {
    alert("Beamit action triggered!"); // Placeholder for the actual action
  };

  const handleReRender = () => {
    handleGenerateImages(); // Simply calls the generate images function again
  };

  return (
    <div style={{ backgroundColor: '#000000', color: '#00ffff', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center' }}>NFT and Local Image Gallery</h1>
      {walletAddress ? (
        <div style={{ display: 'flex' }}>
          <div style={{ width: '40%', padding: '20px', boxSizing: 'border-box' }}>
            <h2>Your Avatar Selection</h2>
            <div
              style={{
                border: '1px solid #ff00ff',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                minHeight: '400px',
              }}
            >
              {selectedNFT ? (
                <>
                  <img
                    src={selectedNFT}
                    alt="Selected"
                    style={{ width: '100%', height: 'auto', maxWidth: '400px', maxHeight: '400px' }}
                  />
                  <button
                    onClick={handleGenerateImages}
                    style={{
                      marginTop: '20px',
                      padding: '10px 16px',
                      fontSize: '16px',
                      cursor: 'pointer',
                      backgroundColor: '#ff00ff',
                      color: '#000000',
                      border: 'none',
                      borderRadius: '4px',
                    }}
                  >
                    Create full body image
                  </button>
                  {loading && <p>Generating images, please wait...</p>}
                </>
              ) : (
                <p>Please select an image to create your avatar.</p>
              )}
            </div>
          </div>

          <div
            style={{
              width: '60%',
              padding: '20px',
              boxSizing: 'border-box',
              overflowY: 'auto',
              maxHeight: '80vh',
            }}
          >
            {generatedImages.length > 0 ? (
              <div>
                <h2>Full Body Image</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {generatedImages.map((imgUrl, index) => (
                    <div
                      key={index}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px',
                      }}
                    >
                      <div
                        style={{
                          border: '1px solid #ff00ff',
                          borderRadius: '8px',
                          padding: '10px',
                          textAlign: 'center',
                        }}
                      >
                        <img
                          src={imgUrl}
                          alt={`Generated ${index}`}
                          style={{ width: '100%', height: 'auto', maxWidth: '400px', maxHeight: '400px' }}
                        />
                        <div style={{ marginTop: '10px' }}>
                          <button
                            onClick={handleBeamit}
                            style={{
                              padding: '10px 16px',
                              fontSize: '16px',
                              cursor: 'pointer',
                              backgroundColor: '#ff00ff',
                              color: '#000000',
                              border: 'none',
                              borderRadius: '4px',
                              marginRight: '10px',
                            }}
                          >
                            Beamit
                          </button>
                          <button
                            onClick={handleReRender}
                            style={{
                              padding: '10px 16px',
                              fontSize: '16px',
                              cursor: 'pointer',
                              backgroundColor: '#ff00ff',
                              color: '#000000',
                              border: 'none',
                              borderRadius: '4px',
                            }}
                          >
                            Re-render
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <h2>Local Images</h2>
                {localImages.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {localImages.map((imageUrl, index) => (
                      <div
                        key={index}
                        style={{
                          width: '25%',
                          boxSizing: 'border-box',
                          padding: '10px',
                        }}
                      >
                        <div
                          style={{
                            border: '1px solid #ff00ff',
                            borderRadius: '8px',
                            padding: '10px',
                            textAlign: 'center',
                          }}
                        >
                          <img
                            src={imageUrl}
                            alt={`Local Image ${index}`}
                            style={{ width: '100%', height: 'auto', maxWidth: '400px', maxHeight: '400px' }}
                          />
                          <button
                            onClick={() => handleCreateAvatar(imageUrl)}
                            style={{
                              marginTop: '10px',
                              padding: '10px 16px',
                              fontSize: '16px',
                              cursor: 'pointer',
                              backgroundColor: '#ff00ff',
                              color: '#000000',
                              border: 'none',
                              borderRadius: '4px',
                            }}
                          >
                            Create 3D Avatar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No local images found.</p>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <p>Connecting to wallet...</p>
      )}
    </div>
  );
}

export default App;
