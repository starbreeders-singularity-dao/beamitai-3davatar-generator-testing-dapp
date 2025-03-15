const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.backend') });

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const axios = require('axios');
const multer = require('multer');
const sharp = require('sharp');
const FormData = require('form-data');
const { exec } = require('child_process');
const fsPromises = require('fs').promises;
const util = require('util');
const execPromisified = util.promisify(require('child_process').exec);

const app = express();
const port = process.env.PORT || 5001;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Initialize Google Cloud Storage
const serviceAccountPath = path.join(__dirname, 'beamit-service-account.json');
console.log('Service account path:', serviceAccountPath);

// Create storage client with simple configuration
const storage = new Storage({ 
  keyFilename: serviceAccountPath,
  projectId: 'beamit-prototype'
});

// Log bucket name for debugging
const bucketName = process.env.GCS_BUCKET;
console.log('Target bucket:', bucketName);

// Check if the app is running in a cloud environment or local
const isCloudEnv = process.env.VERCEL_ENV || process.env.GOOGLE_CLOUD_RUN;

// SSH key setup for cloud environment
let keyPath = process.env.SSH_KEY_PATH;
if (isCloudEnv) {
  // In Cloud environments, write the SSH key from the environment variable to a file
  keyPath = '/tmp/google-cloud1.pem';
  const sshKeyContent = Buffer.from(process.env.SSH_KEY_CLOUD1, 'base64').toString('utf-8');
  fs.writeFileSync(keyPath, sshKeyContent, { mode: 0o600 });
  console.log(`SSH key written to ${keyPath}`);
}

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5001',
  'https://beamitai-avatars.vercel.app',
  'https://beamitai-avatars-hlgb0x8s7-starbreeders.vercel.app'
];

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Middleware
app.use(express.json());

// Set up multer for file uploads to the 'pfp' folder
const upload = multer({
  dest: 'pfp/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
});

// Ensure directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const pfpDir = path.join(__dirname, 'pfp');
const fullBodyImagesDir = path.join(__dirname, 'fullbodyimages');
const glbDir = path.join(__dirname, 'glb');

[uploadsDir, pfpDir, fullBodyImagesDir, glbDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Function to check for new GLB files
async function checkForNewGlbFiles() {
  try {
    const bucket = storage.bucket(bucketName);
    
    // List all files in the trellis-results directory
    const [files] = await bucket.getFiles({
      prefix: 'trellis-results/',
      delimiter: '/'
    });

    console.log('Checking for new GLB files in trellis-results/');

    for (const file of files) {
      if (file.name.endsWith('.glb')) {
        const fileName = path.basename(file.name);
        const localPath = path.join(glbDir, fileName);

        // Check if we already have this file locally
        if (!fs.existsSync(localPath)) {
          console.log('New GLB file found:', fileName);

          // Download the file
          await file.download({
            destination: localPath
          });

          console.log('Downloaded new GLB file:', fileName);

          // Notify all connected WebSocket clients
          const glbData = {
            type: 'newGlbFile',
            fileName: fileName,
            url: `/glb/${fileName}`
          };

          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(glbData));
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking for new GLB files:', error);
  }
}

// Set up periodic checking for new GLB files (every 5 seconds)
setInterval(checkForNewGlbFiles, 5000);

// Also check immediately when the server starts
checkForNewGlbFiles();

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  
  // Send list of existing GLB files to new clients
  const existingGlbFiles = fs.readdirSync(glbDir)
    .filter(file => file.endsWith('.glb'))
    .map(fileName => ({
      type: 'existingGlbFile',
      fileName,
      url: `/glb/${fileName}`
    }));

  if (existingGlbFiles.length > 0) {
    ws.send(JSON.stringify({
      type: 'glbFileList',
      files: existingGlbFiles
    }));
  }
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Route to generate images using Stability API with outpainting
app.post('/generate-images', async (req, res) => {
  const { imageUrl } = req.body;

  console.log('Received request to generate full body image:', imageUrl);

  try {
    // Use the filename that was passed from the frontend
    const savedImagePath = path.join(__dirname, 'pfp', imageUrl);

    // Check if the image exists
    if (!fs.existsSync(savedImagePath)) {
      console.error('Saved image not found:', savedImagePath);
      return res.status(400).json({ error: 'Image not found in pfp folder' });
    }

    console.log('Using saved image from:', savedImagePath);

    // Resize the image to 1024x1024
    const resizedImagePath = `${savedImagePath}-resized.png`;
    await sharp(savedImagePath)
      .resize(1024, 1024)
      .png()
      .toFile(resizedImagePath);

    console.log('Image successfully resized to 1024x1024:', resizedImagePath);

    const formData = new FormData();
    formData.append('image', fs.createReadStream(resizedImagePath));
    formData.append('prompt', "character standing straight, symmetrical, slightly spread legs, symmetrical arms, front facing the viewer. make sure the ratio of leg to body is 1:1");
    formData.append('left', 1000);
    formData.append('right', 1000);
    formData.append('up', 0);
    formData.append('down', 2000);
    formData.append('creativity', 0.5);
    formData.append('seed', 0);
    formData.append('output_format', 'png');

    console.log('Sending request to Stability API...');

    const stabilityResponse = await axios.post('https://api.stability.ai/v2beta/stable-image/edit/outpaint', formData, {
      headers: {
        'Authorization': `Bearer ${process.env.DREAMSTUDIO_API_KEY}`,
        'Accept': 'image/*',
        ...formData.getHeaders(),
      },
      responseType: 'arraybuffer',
    });

    if (stabilityResponse.status === 200) {
      const fullBodyImagesFolder = path.join(__dirname, 'fullbodyimages');
      if (!fs.existsSync(fullBodyImagesFolder)) {
        fs.mkdirSync(fullBodyImagesFolder);
      }

      const outputImagePath = path.join(fullBodyImagesFolder, `beamit-${Date.now()}-fullbody.png`);
      fs.writeFileSync(outputImagePath, stabilityResponse.data);

      console.log('Successfully generated and saved image:', outputImagePath);
      const fullImageUrl = `${req.protocol}://${req.get('host')}/fullbodyimages/${path.basename(outputImagePath)}`;
      res.json({ imagePath: fullImageUrl });
    } else {
      console.error('Stability API returned no images:', stabilityResponse.data);
      res.status(500).json({ error: 'No images returned from Stability API', details: stabilityResponse.data });
    }

    // Cleanup temporary files
    fs.unlink(resizedImagePath, (err) => {
      if (err) console.error('Error deleting resized image:', err.message);
    });
  } catch (error) {
    console.error('Error generating full body image:', error.message);
    console.error('Error details:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error generating full body image', details: error.message });
  }
});

// Endpoint to fetch images from the 'pfp' folder
app.get('/pfp', (req, res) => {
  console.log(`GET request to /pfp from IP: ${req.ip} at ${new Date().toISOString()}`);

  const pfpDir = path.join(__dirname, 'pfp');

  fs.readdir(pfpDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch images.' });
    }

    if (files.length === 0) {
      return res.json({ images: [] });
    }

    const imageUrls = files
      .filter(file => /\.(png|jpg|jpeg|gif)$/i.test(file))
      .map(file => `/pfp/${file}`);

    res.json({ images: imageUrls });
  });
});

// Serve the 'pfp' folder as static content
app.use('/pfp', express.static(path.join(__dirname, 'pfp')));

// Serve the 'fullbodyimages' folder as static content
app.use('/fullbodyimages', express.static(path.join(__dirname, 'fullbodyimages')));

// Add logging to verify initialization
console.log('GCS Credentials loaded from:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
console.log('GCS Bucket:', process.env.GCS_BUCKET);

// Update the upload endpoint with better error handling
app.post('/upload-to-cloud', async (req, res) => {
  const { fileName } = req.body;
  const filePath = path.join(__dirname, 'fullbodyimages', fileName);

  console.log('Starting upload process for:', fileName);
  console.log('File path:', filePath);
  console.log('File exists:', fs.existsSync(filePath));
  console.log('Bucket name:', process.env.GCS_BUCKET);

  if (!fs.existsSync(filePath)) {
    console.error('File does not exist:', filePath);
    return res.status(400).json({ error: 'File does not exist.' });
  }

  try {
    const bucketName = process.env.GCS_BUCKET;
    console.log(`Uploading to bucket: ${bucketName}, file: ${fileName}`);

    // Get bucket reference
    const bucket = storage.bucket(bucketName);
    console.log('Bucket reference created');

    // Upload the file
    const result = await bucket.upload(filePath, {
      destination: `fullbodyimages/${fileName}`,
      metadata: {
        contentType: 'image/png'
      }
    });

    console.log('Upload successful:', result);
    
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/fullbodyimages/${fileName}`;
    
    res.json({ 
      message: 'File successfully uploaded to Cloud Storage',
      url: publicUrl
    });
  } catch (error) {
    console.error('Detailed upload error:', error);
    res.status(500).json({ 
      error: 'Error uploading file', 
      details: error.message,
      stack: error.stack 
    });
  }
});

// Endpoint to save the image in the 'pfp' folder
app.post('/save-image', async (req, res) => {
  const { imageUrl } = req.body;

  console.log('Received request to save image:', imageUrl);

  if (!imageUrl) {
    console.error('Image URL is missing');
    return res.status(400).json({ error: 'Image URL is required.' });
  }

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
      }
    });
    const buffer = Buffer.from(response.data, 'binary');

    const timestamp = Date.now();
    const filename = `beamit-${timestamp}.png`;
    const imagePath = path.join(__dirname, 'pfp', filename);
    fs.writeFileSync(imagePath, buffer);

    console.log('Image saved:', imagePath);
    res.json({ 
      message: 'Image saved successfully.',
      filename: filename  // Return the actual filename used
    });
  } catch (error) {
    console.error('Error saving image:', error.message);
    console.error('Error details:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error saving image', details: error.message });
  }
});

// Rename from /api/videos/status to /api/glb/status
app.get('/api/glb/status', async (req, res) => {
  try {
    console.log('=== GLB Status Check ===');
    console.log('Checking for GLB files in bucket...');
    const bucket = storage.bucket('fullbody-images');
    const [files] = await bucket.getFiles({ prefix: 'dg-results/' });
    
    console.log(`Total files found in bucket: ${files.length}`);
    console.log('All files:', files.map(f => f.name));
    
    const glbFiles = files.filter(file => file.name.endsWith('.glb'));
    console.log(`GLB files found: ${glbFiles.length}`);
    console.log('GLB files:', glbFiles.map(f => f.name));
    
    const latestFile = glbFiles.sort((a, b) => 
      b.metadata.timeCreated - a.metadata.timeCreated
    )[0];

    if (latestFile) {
      console.log('Latest GLB file details:', {
        name: latestFile.name,
        timeCreated: latestFile.metadata.timeCreated,
        size: latestFile.metadata.size
      });
      
      const [signedUrl] = await latestFile.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000,
      });
      console.log('Generated signed URL:', signedUrl);

      res.json({
        signedUrl,
        fileName: latestFile.name,  // Add filename to response
        status: 'ready'
      });
    } else {
      console.log('No GLB files found');
      res.json({ status: 'processing' });
    }
  } catch (error) {
    console.error('Error in GLB status check:', error);
    res.json({ status: 'processing' });
  }
});

// Update the proxy endpoint to match our working test version
app.get('/proxy/glb', async (req, res) => {
  try {
    const storage = new Storage();
    const bucket = storage.bucket('fullbody-images');
    const [files] = await bucket.getFiles({ prefix: 'dg-results/' });
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'No GLB file found' });
    }

    const glbFile = files.find(file => file.name.endsWith('.glb'));
    if (!glbFile) {
      return res.status(404).json({ error: 'No GLB file found' });
    }

    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    const stream = glbFile.createReadStream();
    stream.pipe(res);
  } catch (error) {
    console.error('Error serving GLB:', error);
    res.status(500).json({ error: 'Failed to serve GLB file' });
  }
});

// Update the viewer endpoint to use the proxy URL
app.get('/test/glb', async (req, res) => {
  try {
    console.log('=== Starting GLB Test ===');
    
    const bucket = storage.bucket('fullbody-images');
    const [files] = await bucket.getFiles({ prefix: 'dg-results/' });
    const glbFiles = files.filter(file => file.name.endsWith('.glb'));
    
    if (glbFiles.length === 0) {
      return res.send('No GLB files found');
    }

    const latestFile = glbFiles[0];
    // Use our proxy URL instead of signed URL
    const proxyUrl = `http://localhost:5001/proxy/glb`;

    const createdDate = new Date(latestFile.metadata.timeCreated).toLocaleString();
    const fileSize = (latestFile.metadata.size / 1024 / 1024).toFixed(2);

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GLB Viewer Test</title>
          <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
          <style>
            body { 
              margin: 0; 
              padding: 20px;
              background: #f0f0f0;
              font-family: Arial, sans-serif;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .viewer-container {
              position: relative;
              width: 100%;
              height: 800px;
              background: #e0e0e0;
              border-radius: 4px;
              overflow: hidden;
              margin: 20px 0;
            }
            .info {
              background: #f8f8f8;
              padding: 10px;
              border-radius: 4px;
              margin-top: 20px;
            }
            .error-message {
              color: red;
              background: #ffebee;
              padding: 10px;
              margin: 10px 0;
              border-radius: 4px;
            }
            .loading {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: rgba(0,0,0,0.7);
              color: white;
              padding: 10px 20px;
              border-radius: 20px;
            }
            model-viewer {
              width: 100%;
              height: 100%;
              --model-scale: 3;
              background-color: #e0e0e0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>GLB Viewer Test</h1>
            
            <div class="viewer-container">
              <div id="loading" class="loading">Loading model...</div>
              <model-viewer
                src="${proxyUrl}"
                alt="3D Avatar"
                camera-controls
                auto-rotate
                camera-orbit="0deg 75deg 2.5m"
                min-camera-orbit="auto auto 1.5m"
                max-camera-orbit="auto auto 4m"
                camera-target="0m 0.7m 0m"
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
                ar
                style="--poster-color: transparent; transform: translateY(-30%);"
              ></model-viewer>
            </div>

            <div id="error-container"></div>

            <div class="info">
              <h3>File Information:</h3>
              <p><strong>Name:</strong> ${latestFile.name}</p>
              <p><strong>Size:</strong> ${fileSize} MB</p>
              <p><strong>Created:</strong> ${createdDate}</p>
              <p><strong>Status:</strong> <span id="status">Loading...</span></p>
            </div>
          </div>

          <script>
            const modelViewer = document.querySelector('model-viewer');
            const loading = document.getElementById('loading');
            const status = document.getElementById('status');
            const errorContainer = document.getElementById('error-container');
            
            modelViewer.addEventListener('load', () => {
              console.log('Model loaded successfully');
              loading.style.display = 'none';
              status.textContent = 'Loaded successfully';
            });

            modelViewer.addEventListener('error', (error) => {
              console.error('Error loading model:', error);
              loading.style.display = 'none';
              status.textContent = 'Error loading model';
              errorContainer.innerHTML = \`
                <div class="error-message">
                  Error loading model. Details: \${JSON.stringify(error.detail)}
                </div>
              \`;
            });

            modelViewer.addEventListener('progress', (event) => {
              const progress = event.detail.totalProgress * 100;
              loading.textContent = \`Loading: \${progress.toFixed(1)}%\`;
              status.textContent = \`Loading: \${progress.toFixed(1)}%\`;
              console.log('Loading progress: ' + progress.toFixed(2) + '%');
            });
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Test Error:', error);
    res.status(500).send('Error: ' + error.message);
  }
});

// Add this function to configure bucket CORS
async function configureBucketCors() {
  try {
    const bucket = storage.bucket('fullbody-images');
    await bucket.setCorsConfiguration([
      {
        maxAgeSeconds: 3600,
        method: ['GET', 'HEAD', 'OPTIONS', 'DELETE'],
        origin: ['*'],  // For testing. In production, specify your domains
        responseHeader: ['Content-Type', 'Access-Control-Allow-Origin']
      }
    ]);
    console.log('Bucket CORS configuration updated');
  } catch (error) {
    console.error('Error configuring bucket CORS:', error);
  }
}

// Call this when server starts
configureBucketCors();

// Add this cleanup endpoint
app.post('/api/cleanup', async (req, res) => {
  let errors = [];
  console.log('=== Starting Cleanup Process ===');

  // 1. Clean local backend folders
  try {
    console.log('Cleaning local backend folders...');
    const localPaths = [
      path.join(__dirname, 'fullbodyimages'),
      path.join(__dirname, 'pfp')
    ];
    
    for (const localPath of localPaths) {
      try {
        if (fs.existsSync(localPath)) {
          const files = await fsPromises.readdir(localPath);
          for (const file of files) {
            await fsPromises.unlink(path.join(localPath, file));
          }
          console.log(`Cleaned directory contents: ${localPath}`);
        } else {
          await fsPromises.mkdir(localPath, { recursive: true });
          console.log(`Created directory: ${localPath}`);
        }
      } catch (pathError) {
        console.error(`Error with path ${localPath}:`, pathError);
        errors.push(`Local path ${localPath}: ${pathError.message}`);
      }
    }
  } catch (localError) {
    console.error('Local cleanup error:', localError);
    errors.push(`Local files: ${localError.message}`);
  }

  // 2. Clean Google Cloud Storage (preserving folder structure)
  try {
    console.log('Cleaning Google Cloud Storage...');
    const storage = new Storage({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      projectId: process.env.GOOGLE_CLOUD_PROJECT
    });
    const bucketName = process.env.GCS_BUCKET;
    const bucket = storage.bucket(bucketName);
    
    const [files] = await bucket.getFiles();
    const filesToDelete = files.filter(file => 
      !file.name.endsWith('/') && 
      (file.name.includes('.png') || file.name.includes('.glb'))
    );
    
    console.log(`Found ${filesToDelete.length} files to delete in cloud storage`);
    
    if (filesToDelete.length > 0) {
      for (const file of filesToDelete) {
        try {
          await file.delete();
          console.log(`Deleted cloud file: ${file.name}`);
        } catch (fileError) {
          console.warn(`Could not delete cloud file ${file.name}:`, fileError.message);
          errors.push(`Cloud file ${file.name}: ${fileError.message}`);
        }
      }
    }
    console.log('Cloud storage cleanup completed');
  } catch (cloudError) {
    console.error('Cloud Storage cleanup error:', cloudError);
    errors.push(`Cloud storage: ${cloudError.message}`);
  }

  console.log('=== Cleanup Process Finished ===');
  
  if (errors.length > 0) {
    console.log('Cleanup completed with warnings:', errors);
    res.json({ 
      status: 'partial',
      message: 'Cleanup completed with some warnings',
      warnings: errors
    });
  } else {
    console.log('Cleanup completed successfully');
    res.json({ 
      status: 'success',
      message: 'Cleanup completed successfully' 
    });
  }
});

app.post('/api/upload/fullbody', upload.single('image'), async (req, res) => {
  try {
    console.log('Starting fullbody image upload to bucket...');
    const bucket = storage.bucket('fullbody-images');
    const imageFile = req.file;
    
    // Ensure we're uploading to the correct subfolder
    const destinationPath = `fullbodyimages/${imageFile.filename}`;
    console.log(`Uploading to bucket path: ${destinationPath}`);

    const blob = bucket.file(destinationPath);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: imageFile.mimetype,
      },
    });

    blobStream.on('error', (error) => {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Upload failed', details: error.message });
    });

    blobStream.on('finish', () => {
      console.log('Upload successful:', destinationPath);
      res.status(200).json({
        message: 'Upload successful',
        filename: imageFile.filename,
        path: destinationPath
      });
    });

    blobStream.end(imageFile.buffer);
  } catch (error) {
    console.error('Upload endpoint error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

app.get('/test-glb', (req, res) => {
    res.sendFile(path.join(__dirname, '3dmesh/beamit-1736491657175-fullbody.glb'));
});

// Load NFT routes
const nftRoutes = require('./routes/nftRoutes');
app.use(nftRoutes);

// Ensure environment variables are set for Alchemy
if (!process.env.ALCHEMY_API_KEY) {
  console.warn('ALCHEMY_API_KEY environment variable is not set. Some NFT functionality may not work correctly.');
}

// Start the backend server
app.listen(port, '0.0.0.0', () => {
  console.log(`Backend server running on port ${port}`);
});

