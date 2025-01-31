const express = require('express');
const app = express();
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { exec } = require('child_process');
const FormData = require('form-data');
const { Storage } = require('@google-cloud/storage'); // Import Google Cloud Storage
const WebSocket = require('ws');


// Use the environment variable for the port or default to 5001 for local development
const port = process.env.PORT || 5001;

// Load the renamed .env.backend file instead of the default .env
require('dotenv').config({ path: './.env.backend' });

// Dynamically set the SSH key path depending on the environment
let keyPath = process.env.SSH_KEY_PATH;

// Check if the app is running in a cloud environment or local
const isCloudEnv = process.env.VERCEL_ENV || process.env.GOOGLE_CLOUD_RUN;

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
  'https://beamitai-avatars.vercel.app',
  'https://beamitai-avatars-hlgb0x8s7-starbreeders.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Middleware to parse JSON
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

// Initialize Google Cloud Storage with credentials
const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: 'beamit-prototype'
});

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

// Endpoint to fetch video files
app.get('/api/videos', async (req, res) => {
    const storage = new Storage();
    const bucketName = process.env.GCS_BUCKET;
    const resultsFolder = 'dg-results';

    try {
        const [files] = await storage.bucket(bucketName).getFiles({
            directory: resultsFolder,
        });

        const mp4Files = files.filter(file => file.name.endsWith('.mp4')).map(file => {
            return {
                name: file.name,
                url: `https://storage.googleapis.com/${bucketName}/${file.name}`,
            };
        });

        res.status(200).json(mp4Files);
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).send('Error fetching video files');
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

// Store connected clients
const clients = new Set();

// Update the video-ready endpoint to notify clients
app.post('/video-ready', async (req, res) => {
  const { videoUrl, fileName } = req.body;
  
  console.log('Received video-ready request:', { videoUrl, fileName });
  
  try {
    // Create videos directory if it doesn't exist
    const videosDir = path.join(__dirname, 'videos');
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir);
      console.log('Created videos directory:', videosDir);
    }

    console.log('Downloading video from:', videoUrl);
    
    // Download the video
    const response = await axios({
      method: 'get',
      url: videoUrl,
      responseType: 'stream'
    });

    const localVideoPath = path.join(videosDir, path.basename(fileName));
    console.log('Saving video to:', localVideoPath);

    const writer = fs.createWriteStream(localVideoPath);

    // Pipe the video data to the file
    response.data.pipe(writer);

    // Wait for the download to complete
    await new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('Video file write completed');
        resolve();
      });
      writer.on('error', (err) => {
        console.error('Error writing video file:', err);
        reject(err);
      });
    });

    console.log('Video downloaded successfully:', localVideoPath);

    // Notify connected clients
    const videoData = {
      type: 'video-ready',
      videoUrl: `http://localhost:5001/videos/${path.basename(fileName)}`
    };

    console.log('Notifying clients with:', videoData);

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(videoData));
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error handling video:', error);
    res.status(500).json({ error: 'Error handling video', details: error.message });
  }
});

// Add POST endpoint for video notifications
app.post('/api/videos', async (req, res) => {
    const { videoUrl, fileName } = req.body;
    
    console.log('Received video notification:', { videoUrl, fileName });
    
    try {
        // Create videos directory if it doesn't exist
        const videosDir = path.join(__dirname, 'videos');
        if (!fs.existsSync(videosDir)) {
            fs.mkdirSync(videosDir);
            console.log('Created videos directory:', videosDir);
        }

        console.log('Downloading video from:', videoUrl);
        
        // Download the video
        const response = await axios({
            method: 'get',
            url: videoUrl,
            responseType: 'stream'
        });

        const localVideoPath = path.join(videosDir, path.basename(fileName));
        console.log('Saving video to:', localVideoPath);
        
        const writer = fs.createWriteStream(localVideoPath);
        response.data.pipe(writer);

        res.json({ 
            success: true,
            message: 'Video received and processing',
            localPath: localVideoPath
        });
    } catch (error) {
        console.error('Error handling video:', error);
        res.status(500).json({ 
            error: 'Error processing video', 
            details: error.message 
        });
    }
});

// Add this endpoint to get video status
app.get('/api/videos/status', (req, res) => {
  // Return the most recent video URL
  const videosDir = path.join(__dirname, 'videos');
  const files = fs.readdirSync(videosDir);
  const latestVideo = files[files.length - 1];
  
  if (latestVideo) {
    res.json({
      videoUrl: `http://localhost:5001/videos/${latestVideo}`,
      status: 'ready'
    });
  } else {
    res.json({ status: 'processing' });
  }
});

// Serve video files statically
app.use('/videos', express.static(path.join(__dirname, 'videos')));

const wss = new WebSocket.Server({ port: 5002 });

wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.add(ws);
  
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

// Start the backend server
app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
