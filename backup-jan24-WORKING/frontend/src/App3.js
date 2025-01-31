import React, { useEffect, useState } from 'react';

function App() {
  const [localImages, setLocalImages] = useState([]); // State for local images
  const [loading, setLoading] = useState(false); // State to track loading
  const [error, setError] = useState(null); // State to track any errors

  // Fetch images from the backend 'pfp' folder
  useEffect(() => {
    const fetchLocalImages = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors

        const response = await fetch('http://localhost:5001/pfp'); // Ensure correct backend URL is used

        if (response.headers.get('content-type')?.includes('application/json')) {
          const data = await response.json();

          // Prepend the correct base URL to the image paths
          const fullImagePaths = data.images.map(img => `http://localhost:5001${img}`);
          setLocalImages(fullImagePaths);
        } else {
          throw new Error('Invalid JSON response');
        }
        
      } catch (error) {
        console.error('Error fetching local images:', error.message);
        setError('Failed to load images');
      } finally {
        setLoading(false);
      }
    };

    fetchLocalImages();
  }, []);

  return (
    <div style={{ backgroundColor: '#000000', color: '#00ffff', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center' }}>Local Image Gallery</h1>
      <div style={{ padding: '20px', boxSizing: 'border-box' }}>
        {loading ? (
          <p>Loading images, please wait...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <>
            {localImages.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {localImages.map((imgUrl, index) => (
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
                        src={imgUrl}
                        alt={`Local Image ${index}`}
                        style={{ width: '100%', height: 'auto' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No images found in the folder.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
