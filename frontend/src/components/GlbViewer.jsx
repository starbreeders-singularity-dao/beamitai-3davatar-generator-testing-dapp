import React, { useEffect, useState } from 'react';

const GlbViewer = () => {
  const [glbFiles, setGlbFiles] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // Create WebSocket connection
    const websocket = new WebSocket('ws://localhost:5001');

    websocket.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'glbFileList':
          // Handle initial list of GLB files
          setGlbFiles(data.files);
          break;
          
        case 'newGlbFile':
          // Add new GLB file to the list
          setGlbFiles(prev => [...prev, {
            type: 'existingGlbFile',
            fileName: data.fileName,
            url: data.url
          }]);
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };

    // Store WebSocket instance
    setWs(websocket);

    // Clean up on unmount
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  return null; // Component no longer displays any content
};

export default GlbViewer;

// Add some basic styles
const styles = `
  .download-button {
    display: inline-block;
    padding: 8px 16px;
    background-color: #4CAF50;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    margin-top: 8px;
  }

  .download-button:hover {
    background-color: #45a049;
  }
`;

// Add styles to document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet); 