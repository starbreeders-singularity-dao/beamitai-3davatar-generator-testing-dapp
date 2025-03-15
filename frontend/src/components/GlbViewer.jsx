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

  return (
    <div>
      <h2>3D Models</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {glbFiles.map((file, index) => (
          <div key={index} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }}>
            <h3>{file.fileName}</h3>
            {/* You can add a 3D viewer component here */}
            <a href={file.url} download className="download-button">
              Download GLB
            </a>
          </div>
        ))}
      </div>
      {glbFiles.length === 0 && (
        <p>No 3D models available yet. They will appear here automatically when ready.</p>
      )}
    </div>
  );
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