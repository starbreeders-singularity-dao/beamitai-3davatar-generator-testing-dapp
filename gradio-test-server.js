const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3001;

// Enable CORS
app.use(cors());

// Parse JSON requests
app.use(express.json());

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Create glb directory if it doesn't exist
const glbDir = path.join(__dirname, 'backend', 'glb');
if (!fs.existsSync(glbDir)) {
  fs.mkdirSync(glbDir, { recursive: true });
  console.log('Created glb directory:', glbDir);
}

// Check if fullbodyimages directory exists
const fullbodyImagesDir = path.join(__dirname, 'backend', 'fullbodyimages');
if (fs.existsSync(fullbodyImagesDir)) {
  console.log('fullbodyimages directory exists at:', fullbodyImagesDir);
  // List some files in the directory for debugging
  const files = fs.readdirSync(fullbodyImagesDir).slice(0, 5);
  console.log('Sample files in fullbodyimages:', files);
} else {
  console.error('fullbodyimages directory does not exist at:', fullbodyImagesDir);
}

// Serve static files
app.use('/fullbodyimages', express.static(path.join(__dirname, 'backend', 'fullbodyimages')));
app.use('/glb', express.static(path.join(__dirname, 'backend', 'glb')));

// Root route to redirect to test page
app.get('/', (req, res) => {
  res.redirect('/test');
});

// Endpoint to send image to Gradio
app.post('/send-to-gradio', async (req, res) => {
  const { imagePath } = req.body;
  const fullPath = path.join(__dirname, imagePath);
  
  console.log('Starting upload process for:', imagePath);
  console.log('Full path:', fullPath);
  
  if (!fs.existsSync(fullPath)) {
    console.error('File does not exist:', fullPath);
    return res.status(400).json({ success: false, error: 'File does not exist.' });
  }
  
  try {
    console.log('Sending image to TRELLIS app...');
    
    // Try multiple approaches to connect with TRELLIS
    
    // Approach 1: Direct Gradio API call with proper format
    try {
      console.log('Approach 1: Trying direct Gradio API call with proper format...');
      
      // Step 1: Upload the file to the TRELLIS server
      const formData = new FormData();
      formData.append('files', fs.createReadStream(fullPath));
      
      const uploadResponse = await axios.post('http://34.42.169.146:8080/upload', formData, {
        headers: {
          ...formData.getHeaders(),
        }
      });
      
      console.log('Upload response status:', uploadResponse.status);
      console.log('Upload response data:', JSON.stringify(uploadResponse.data));
      
      if (!Array.isArray(uploadResponse.data) || uploadResponse.data.length === 0) {
        throw new Error('Invalid upload response from TRELLIS server');
      }
      
      // Step 2: Call the predict endpoint with the proper format
      const fileData = uploadResponse.data[0]; // Get the first uploaded file path
      
      // Create the proper file data object according to Gradio's format
      const fileDataObject = {
        orig_name: path.basename(fullPath),
        path: fileData,
        url: null,
        meta: { _type: "gradio.FileData" }
      };
      
      console.log('File data object:', JSON.stringify(fileDataObject));
      
      // Try with the exact format that works with the Gradio app
      const predictResponse = await axios.post('http://34.42.169.146:8080/run/predict', {
        data: [fileDataObject]
      }, {
        timeout: 300000 // 5 minute timeout for processing
      });
      
      console.log('Predict response status:', predictResponse.status);
      console.log('Predict response data:', JSON.stringify(predictResponse.data));
      
      // Process the response to extract GLB data
      let glbData;
      let glbUrl;
      
      if (predictResponse.data && predictResponse.data.data) {
        const resultData = Array.isArray(predictResponse.data.data) ? 
          predictResponse.data.data[0] : predictResponse.data.data;
        
        console.log('Result data:', JSON.stringify(resultData));
        
        if (resultData && resultData.url) {
          glbUrl = resultData.url;
          console.log('GLB URL found in response:', glbUrl);
          
          const glbResponse = await axios.get(glbUrl, {
            responseType: 'arraybuffer'
          });
          
          glbData = glbResponse.data;
        } else if (resultData && resultData.data) {
          console.log('GLB data found in response (base64)');
          glbData = Buffer.from(resultData.data, 'base64');
        } else if (typeof resultData === 'string') {
          console.log('GLB data found in response (string)');
          // Try to interpret the string as a base64 encoded GLB
          try {
            glbData = Buffer.from(resultData, 'base64');
          } catch (e) {
            console.error('Error parsing GLB data from string:', e.message);
          }
        }
      }
      
      if (!glbData && !glbUrl) {
        // Try to interpret the entire response as GLB data
        console.log('Trying to interpret entire response as GLB data');
        if (predictResponse.data) {
          if (typeof predictResponse.data === 'string') {
            try {
              glbData = Buffer.from(predictResponse.data, 'base64');
              console.log('Successfully interpreted response as base64 GLB data');
            } catch (e) {
              console.error('Error parsing entire response as GLB data:', e.message);
            }
          } else if (Buffer.isBuffer(predictResponse.data)) {
            glbData = predictResponse.data;
            console.log('Response is already a buffer, using as GLB data');
          }
        }
      }
      
      if (!glbData && !glbUrl) {
        throw new Error('Could not find GLB data or URL in the response');
      }
      
      // Generate a unique name for the GLB file and save it
      const glbFilename = `avatar_${Date.now()}.glb`;
      const outputFilePath = path.join(glbDir, glbFilename);
      
      if (glbData) {
        fs.writeFileSync(outputFilePath, glbData);
        console.log('GLB file saved from data to:', outputFilePath);
      } else if (glbUrl) {
        const glbResponse = await axios.get(glbUrl, {
          responseType: 'arraybuffer'
        });
        
        fs.writeFileSync(outputFilePath, glbResponse.data);
        console.log('GLB file saved from URL to:', outputFilePath);
      }
      
      return res.json({
        success: true,
        message: 'GLB file generated successfully using direct Gradio API approach',
        fileName: glbFilename,
        glbPath: `/glb/${glbFilename}`,
        approach: 'direct_gradio_api',
        responseData: predictResponse.data
      });
    } catch (approach1Error) {
      console.error('Approach 1 failed:', approach1Error.message);
      if (approach1Error.response) {
        console.error('Response status:', approach1Error.response.status);
        console.error('Response headers:', JSON.stringify(approach1Error.response.headers));
        if (approach1Error.response.data) {
          if (typeof approach1Error.response.data === 'string') {
            console.error('Response data:', approach1Error.response.data);
          } else if (Buffer.isBuffer(approach1Error.response.data)) {
            console.error('Response data is a buffer of length:', approach1Error.response.data.length);
          } else {
            console.error('Response data:', JSON.stringify(approach1Error.response.data));
          }
        }
      }
    }
    
    // Approach 2: Try with a different file parameter name
    try {
      console.log('Approach 2: Trying with a different file parameter name...');
      
      // Create a form with the image using a different parameter name
      const formData = new FormData();
      formData.append('image', fs.createReadStream(fullPath));
      
      // Send directly to the predict endpoint
      const directResponse = await axios.post('http://34.42.169.146:8080/run/predict', formData, {
        headers: {
          ...formData.getHeaders(),
        },
        responseType: 'arraybuffer',
        timeout: 300000 // 5 minute timeout
      });
      
      console.log('Direct response status:', directResponse.status);
      
      // If we get here, we succeeded with the direct approach
      const glbFilename = `avatar_${Date.now()}.glb`;
      const outputFilePath = path.join(glbDir, glbFilename);
      fs.writeFileSync(outputFilePath, directResponse.data);
      
      console.log('GLB file saved to:', outputFilePath);
      
      return res.json({
        success: true,
        message: 'GLB file generated successfully using direct file upload approach',
        fileName: glbFilename,
        glbPath: `/glb/${glbFilename}`,
        approach: 'direct_file_upload'
      });
    } catch (approach2Error) {
      console.error('Approach 2 failed:', approach2Error.message);
      if (approach2Error.response) {
        console.error('Response status:', approach2Error.response.status);
        console.error('Response headers:', JSON.stringify(approach2Error.response.headers));
      }
    }
    
    // Approach 3: Try with a different endpoint structure
    try {
      console.log('Approach 3: Trying with a different endpoint structure...');
      
      // Create a form with the image
      const formData = new FormData();
      formData.append('file', fs.createReadStream(fullPath));
      
      // Try the API endpoint with a different structure
      const apiResponse = await axios.post('http://34.42.169.146:8080/api/trellis/generate', formData, {
        headers: {
          ...formData.getHeaders(),
        },
        responseType: 'arraybuffer',
        timeout: 300000 // 5 minute timeout
      });
      
      console.log('API response status:', apiResponse.status);
      
      // If we get here, we succeeded with this approach
      const glbFilename = `avatar_${Date.now()}.glb`;
      const outputFilePath = path.join(glbDir, glbFilename);
      fs.writeFileSync(outputFilePath, apiResponse.data);
      
      console.log('GLB file saved to:', outputFilePath);
      
      return res.json({
        success: true,
        message: 'GLB file generated successfully using API endpoint approach',
        fileName: glbFilename,
        glbPath: `/glb/${glbFilename}`,
        approach: 'api_endpoint'
      });
    } catch (approach3Error) {
      console.error('Approach 3 failed:', approach3Error.message);
      if (approach3Error.response) {
        console.error('Response status:', approach3Error.response.status);
        console.error('Response headers:', JSON.stringify(approach3Error.response.headers));
      }
    }
    
    // If we've tried all approaches and none worked, return an error with detailed information
    return res.status(500).json({
      success: false,
      error: 'All approaches to connect with TRELLIS failed',
      details: 'The TRELLIS server is returning errors for all our connection attempts. This might be due to server-side issues or configuration problems.',
      suggestion: 'Please try again later or contact the TRELLIS maintainers. You can also try using the Gradio app directly at http://34.42.169.146:8080/',
      serverInfo: {
        url: 'http://34.42.169.146:8080/',
        imagePath: fullPath
      }
    });
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Unexpected error occurred',
      details: error.message,
      stack: error.stack
    });
  }
});

// Add a route to serve the test.html page
app.get('/test', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TRELLIS Test</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #333;
        }
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .image-container {
          margin: 20px 0;
          border: 1px solid #ddd;
          padding: 10px;
          border-radius: 5px;
        }
        img {
          max-width: 100%;
          max-height: 400px;
        }
        button {
          background-color: #4CAF50;
          border: none;
          color: white;
          padding: 15px 32px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          margin: 10px 2px;
          cursor: pointer;
          border-radius: 5px;
        }
        button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        .status {
          margin-top: 20px;
          padding: 10px;
          border-radius: 5px;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .success {
          background-color: #dff0d8;
          color: #3c763d;
        }
        .error {
          background-color: #f2dede;
          color: #a94442;
        }
        .loading {
          background-color: #d9edf7;
          color: #31708f;
        }
        .model-viewer {
          width: 100%;
          height: 400px;
          margin-top: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .debug-info {
          margin-top: 20px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          background-color: #f9f9f9;
          font-family: monospace;
          font-size: 12px;
          white-space: pre-wrap;
          word-break: break-word;
          max-height: 300px;
          overflow-y: auto;
        }
        .tabs {
          display: flex;
          margin-top: 20px;
          border-bottom: 1px solid #ddd;
        }
        .tab {
          padding: 10px 15px;
          cursor: pointer;
          border: 1px solid transparent;
          border-bottom: none;
          margin-bottom: -1px;
        }
        .tab.active {
          border-color: #ddd;
          border-radius: 5px 5px 0 0;
          background-color: white;
        }
        .tab-content {
          display: none;
          padding: 15px;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 5px 5px;
        }
        .tab-content.active {
          display: block;
        }
        .progress-steps {
          margin: 20px 0;
          width: 100%;
        }
        .step {
          margin-bottom: 10px;
          padding: 10px;
          border-radius: 5px;
          background-color: #f5f5f5;
          display: flex;
          align-items: center;
        }
        .step-number {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: #ccc;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 10px;
          font-weight: bold;
        }
        .step.active .step-number {
          background-color: #4CAF50;
        }
        .step.completed .step-number {
          background-color: #3c763d;
        }
        .step.error .step-number {
          background-color: #a94442;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>TRELLIS 3D Avatar Generator</h1>
        
        <div class="image-container">
          <h2>Test Image</h2>
          <img id="testImage" src="/fullbodyimages/beamit-1741786964822-fullbody.png" alt="Test Image">
        </div>
        
        <button id="sendButton" onclick="sendToTrellis()">Generate 3D Avatar</button>
        
        <div id="status" class="status" style="display: none;"></div>
        
        <div class="progress-steps" id="progressSteps" style="display: none;">
          <div class="step" id="step1">
            <div class="step-number">1</div>
            <div class="step-text">Uploading image to TRELLIS server...</div>
          </div>
          <div class="step" id="step2">
            <div class="step-number">2</div>
            <div class="step-text">Processing image with TRELLIS...</div>
          </div>
          <div class="step" id="step3">
            <div class="step-number">3</div>
            <div class="step-text">Downloading and saving GLB file...</div>
          </div>
        </div>
        
        <div class="tabs">
          <div class="tab active" onclick="showTab('result')">3D Result</div>
          <div class="tab" onclick="showTab('debug')">Debug Info</div>
        </div>
        
        <div id="resultTab" class="tab-content active">
          <div id="resultContainer" style="display: none;">
            <h2>3D Avatar Result</h2>
            <div id="modelViewer" class="model-viewer"></div>
            <p>GLB file saved to: <span id="glbPath"></span></p>
          </div>
        </div>
        
        <div id="debugTab" class="tab-content">
          <div id="debugInfo" class="debug-info">No debug information available yet.</div>
        </div>
      </div>

      <script>
        // The image path relative to the backend directory
        const imagePath = 'backend/fullbodyimages/beamit-1741786964822-fullbody.png';
        
        function showTab(tabName) {
          // Hide all tabs
          document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
          });
          
          document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
          });
          
          // Show the selected tab
          document.getElementById(tabName + 'Tab').classList.add('active');
          
          // Activate the tab button
          document.querySelectorAll('.tab').forEach(tab => {
            if (tab.textContent.toLowerCase().includes(tabName.toLowerCase())) {
              tab.classList.add('active');
            }
          });
        }
        
        // Add a function to check if the image loaded successfully
        document.getElementById('testImage').addEventListener('load', function() {
          console.log('Image loaded successfully');
        });
        
        document.getElementById('testImage').addEventListener('error', function() {
          console.log('Image failed to load');
          document.getElementById('status').className = 'status error';
          document.getElementById('status').textContent = 'Error: Image failed to load. Check the server console for details.';
          document.getElementById('status').style.display = 'block';
        });
        
        function showDebugInfo(info) {
          const debugEl = document.getElementById('debugInfo');
          debugEl.textContent = JSON.stringify(info, null, 2);
          showTab('debug');
        }
        
        function updateStep(stepNumber, status, message) {
          const step = document.getElementById(\`step\${stepNumber}\`);
          
          // Remove all status classes
          step.classList.remove('active', 'completed', 'error');
          
          // Add the appropriate class only if status is not empty
          if (status && status.trim() !== '') {
            step.classList.add(status);
          }
          
          // Update the message if provided
          if (message) {
            step.querySelector('.step-text').textContent = message;
          }
        }
        
        async function sendToTrellis() {
          const statusEl = document.getElementById('status');
          const sendButton = document.getElementById('sendButton');
          const resultContainer = document.getElementById('resultContainer');
          const glbPathEl = document.getElementById('glbPath');
          const modelViewerEl = document.getElementById('modelViewer');
          const debugEl = document.getElementById('debugInfo');
          const progressSteps = document.getElementById('progressSteps');
          
          // Update UI
          statusEl.className = 'status loading';
          statusEl.textContent = 'Sending image to TRELLIS... (Trying multiple approaches)';
          statusEl.style.display = 'block';
          sendButton.disabled = true;
          resultContainer.style.display = 'none';
          debugEl.textContent = 'Processing...';
          progressSteps.style.display = 'block';
          
          // Reset all steps
          updateStep(1, 'active', 'Trying multiple approaches to connect with TRELLIS...');
          updateStep(2, '', 'Processing image with TRELLIS...');
          updateStep(3, '', 'Downloading and saving GLB file...');
          
          try {
            // Send the request to our test server
            const response = await fetch('/send-to-gradio', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ imagePath }),
            });
            
            // Update step 1 as completed
            updateStep(1, 'completed', 'Connection established with TRELLIS');
            updateStep(2, 'active', 'Processing image with TRELLIS...');
            
            const data = await response.json();
            
            // Show debug info
            showDebugInfo(data);
            
            if (data.success) {
              // Update steps as completed
              updateStep(2, 'completed', 'Image processed successfully');
              updateStep(3, 'completed', 'GLB file saved successfully');
              
              // Update UI for success
              statusEl.className = 'status success';
              statusEl.textContent = \`\${data.message}\${data.approach ? ' (Approach: ' + data.approach + ')' : ''}\`;
              
              // Display the GLB file info
              glbPathEl.textContent = data.glbPath;
              resultContainer.style.display = 'block';
              
              // Show the result tab
              showTab('result');
              
              // Load the model viewer
              modelViewerEl.innerHTML = \`
                <model-viewer
                  src="\${data.glbPath}"
                  alt="3D Avatar"
                  auto-rotate
                  camera-controls
                  style="width: 100%; height: 400px;"
                ></model-viewer>
              \`;
              
              // Load the model-viewer component
              const script = document.createElement('script');
              script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
              document.head.appendChild(script);
            } else {
              // Update steps with error
              updateStep(2, 'error', 'Error processing image');
              updateStep(3, 'error', 'Could not generate GLB file');
              
              // Update UI for error
              statusEl.className = 'status error';
              let errorMessage = \`Error: \${data.error}\`;
              
              if (data.details) {
                errorMessage += \`\n\nDetails: \${data.details}\`;
              }
              
              if (data.suggestion) {
                errorMessage += \`\n\nSuggestion: \${data.suggestion}\`;
              }
              
              statusEl.textContent = errorMessage;
              
              // Show the debug tab
              showTab('debug');
            }
          } catch (error) {
            console.error('Error:', error);
            
            // Update step with error
            updateStep(1, 'error', 'Error communicating with server');
            updateStep(2, 'error', 'Could not process image');
            updateStep(3, 'error', 'Could not generate GLB file');
            
            statusEl.className = 'status error';
            statusEl.textContent = \`Error: \${error.message}\`;
            
            // Show debug info
            showDebugInfo({ error: error.toString(), stack: error.stack });
            
            // Show the debug tab
            showTab('debug');
          } finally {
            sendButton.disabled = false;
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Start the server
app.listen(port, () => {
  console.log(`Gradio test server running at http://localhost:${port}`);
});
