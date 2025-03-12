require('dotenv').config({ path: '.env.backend' });

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const multer = require('multer');
const sharp = require('sharp');
const FormData = require('form-data');

const app = express();
const port = process.env.PORT || 5001;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Initialize Google Cloud Storage
const serviceAccountPath = path.join(__dirname, 'beamit-service-account.json');
console.log('Service account path:', serviceAccountPath);

// Create storage client with simple configuration (matching our test script)
const storage = new Storage({ 
  keyFilename: serviceAccountPath
});

// Log bucket name for debugging
console.log('Target bucket:', process.env.GCS_BUCKET);

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

[uploadsDir, pfpDir, fullBodyImagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Generate images endpoint
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
    
    // Debug: Check if API key is loaded
    console.log('API Key Status:', process.env.STABILITY_API_KEY ? 'API key is set' : 'API key is missing');
    
    // Create headers with API key
    const headers = {
      'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
      'Accept': 'image/*',
      ...formData.getHeaders(),
    };
    
    console.log('Request Headers:', {
      Authorization: headers.Authorization ? 'Bearer [REDACTED]' : 'Not set',
      Accept: headers.Accept,
      // Other headers without exposing sensitive information
    });

    try {
      const stabilityResponse = await axios.post('https://api.stability.ai/v2beta/stable-image/edit/outpaint', formData, {
        headers,
        responseType: 'arraybuffer',
        timeout: 60000, // 60 second timeout
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      // Log the response headers for debugging
      console.log('Stability API Response Headers:', stabilityResponse.headers);
      console.log('Stability API Response Status:', stabilityResponse.status);

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
    } catch (apiError) {
      // Handle API error specifically
      console.error('Stability API Error:', apiError.message);
      
      // If we have a response, try to parse it for more details
      if (apiError.response) {
        console.error('Status:', apiError.response.status);
        console.error('Headers:', apiError.response.headers);
        
        // If the response is a buffer (arraybuffer), convert it to a string
        if (apiError.response.data instanceof Buffer) {
          try {
            const errorData = JSON.parse(apiError.response.data.toString());
            console.error('Error Data:', errorData);
            return res.status(apiError.response.status).json({ 
              error: 'Error from Stability API', 
              details: errorData 
            });
          } catch (parseError) {
            console.error('Error parsing response data:', parseError);
            console.error('Raw response data:', apiError.response.data.toString());
          }
        } else {
          console.error('Response Data:', apiError.response.data);
        }
      }
      
      return res.status(500).json({ 
        error: 'Error from Stability API', 
        details: apiError.message 
      });
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

// Save image endpoint
app.post('/save-image', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    console.log('Downloading image from:', imageUrl);
    
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });

    const timestamp = Date.now();
    const filename = `beamit-${timestamp}.png`;
    const filepath = path.join(pfpDir, filename);

    fs.writeFileSync(filepath, response.data);
    console.log('Image saved successfully:', filepath);

    res.json({ filename });
  } catch (error) {
    console.error('Error saving image:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload to cloud endpoint
app.post('/upload-to-cloud', async (req, res) => {
  const { fileName } = req.body;
  const filePath = path.join(__dirname, 'fullbodyimages', fileName);

  console.log('Starting upload process for:', fileName);
  console.log('File path:', filePath);
  console.log('File exists:', fs.existsSync(filePath));
  
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

    // First, test bucket access
    console.log('Testing bucket access...');
    const [exists] = await bucket.exists();
    console.log('Bucket exists:', exists);

    if (!exists) {
      throw new Error(`Bucket ${bucketName} does not exist or is not accessible`);
    }

    // Upload the file with a folder structure
    const destination = `fullbodyimages/${fileName}`;
    console.log('Starting file upload to:', destination);
    
    const [file] = await bucket.upload(filePath, {
      destination: destination,
      metadata: {
        contentType: 'image/png'
      }
    });

    console.log('Upload successful:', file.name);
    
    // Get the public URL (using the proper format for Uniform Bucket-Level Access)
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`;
    console.log('Public URL:', publicUrl);
    
    res.json({ 
      message: 'File successfully uploaded to Cloud Storage',
      url: publicUrl
    });
  } catch (error) {
    console.error('Detailed upload error:', error);
    console.error('Error stack:', error.stack);
    
    if (error.message && error.message.includes('Invalid JWT Signature')) {
      console.error('\nJWT Signature error detected. Debugging info:');
      console.error('Service account path:', serviceAccountPath);
      console.error('Service account exists:', fs.existsSync(serviceAccountPath));
      console.error('Bucket name:', process.env.GCS_BUCKET);
      
      return res.status(500).json({
        error: 'Authentication error with Google Cloud Storage',
        details: 'Invalid service account credentials'
      });
    }
    
    res.status(500).json({ 
      error: 'Error uploading file', 
      details: error.message
    });
  }
});

// Serve static files
app.use('/pfp', express.static(path.join(__dirname, 'pfp')));
app.use('/fullbodyimages', express.static(path.join(__dirname, 'fullbodyimages')));
app.use('/uploads', express.static('uploads'));

// Start the server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`WebSocket server is ready`);
  console.log(`Uploads directory: ${uploadsDir}`);
});