import React, { useEffect, useState } from 'react';
import AvatarSelection from './components/AvatarSelection';
import ImageGallery from './components/ImageGallery';
import { fetchLocalImages, generateImages, uploadImageToCloud } from './utils/api';
import './App.css';
import logo from './images/beamit-ai-logo.png'; // Import the logo

console.log('Backend URL:', process.env.REACT_APP_API_URL);


function App() {
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [localImages, setLocalImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pfpFile, setPfpFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [dots, setDots] = useState('');

  // Fetch images from the backend using the environment variable
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const images = await fetchLocalImages(); // Fetch from the backend
        console.log('Fetched images:', images); // Log the fetched images to debug
        setLocalImages(images); // Set the images into state
      } catch (error) {
        console.error('Error fetching local images:', error);
      }
    };
  
    fetchImages(); // Fetch images on component mount
  }, []);
  

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setDots((prevDots) => (prevDots.length < 3 ? prevDots + '.' : ''));
      }, 500); // Change dots every 500ms
      return () => clearInterval(interval); // Cleanup on component unmount
    } else {
      setDots(''); // Reset dots when not loading
    }
  }, [loading]);

  const handleCreateAvatar = async (imageUrl) => {
    setSelectedNFT(imageUrl);
    setGeneratedImages([]);
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], 'pfpImage.jpg', { type: blob.type });
      setPfpFile(file);
    } catch (error) {
      console.error('Error fetching image:', error);
    }
  };

  const handleGenerateImages = async () => {
    if (!selectedNFT || !pfpFile) {
      alert('Please select an image first.');
      return;
    }
    try {
      setLoading(true);
      const data = await generateImages(pfpFile);
      setGeneratedImages([`${data.imagePath}`]);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      alert(`Error generating images: ${error.message}`);
    }
  };

  const handleBeamit = async () => {
    if (!generatedImages.length) {
      alert('Please generate an image first.');
      return;
    }

    const fullBodyImage = generatedImages[0].split('/').pop();
    try {
      setUploadStatus('Uploading image to Google Cloud...');
      await uploadImageToCloud(fullBodyImage);
      setUploadStatus('Upload successful!');
    } catch (error) {
      setUploadStatus(`Upload failed: ${error.message}`);
    }
  };

  const handleBack = () => {
    setSelectedNFT(null);
    setGeneratedImages([]);
    setUploadStatus(null);
    setLoading(false);
    setDots('');
  };

  // Forward button handler (jump to generated image)
  const handleForward = () => {
    if (generatedImages.length) {
      document.getElementById('generated-image-section').scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} alt="Beamit AI Logo" className="App-logo" />
        <h1>2D to 3D - Beam your Avatar</h1>
      </header>

      <div className="App-content">
        <div style={{ display: 'flex' }}>
          <AvatarSelection
            selectedNFT={selectedNFT}
            handleGenerateImages={handleGenerateImages}
            loading={loading}
            dots={dots}
          />
          <ImageGallery
            generatedImages={generatedImages}
            localImages={localImages}
            handleCreateAvatar={handleCreateAvatar}
            handleBeamit={handleBeamit}
            handleBack={handleBack}
            uploadStatus={uploadStatus}
          />
          
        </div>
      </div>
    </div>
  );
}

export default App;
