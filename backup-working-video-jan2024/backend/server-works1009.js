const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { exec } = require('child_process');
const FormData = require('form-data');
const { Storage } = require('@google-cloud/storage'); // Import Google Cloud Storage
const app = express();

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
app.post('/generate-images', upload.single('pfpImage'), async (req, res) => {
  const pfpImage = req.file;

  if (!pfpImage) {
    return res.status(400).json({ error: 'Profile picture image is required.' });
  }

  console.log('--- Image Upload Details ---');
  console.log(`Original Name: ${pfpImage.originalname}`);
  console.log(`MIME Type: ${pfpImage.mimetype}`);
  console.log(`Size: ${pfpImage.size} bytes`);
  console.log(`Stored At: ${pfpImage.path}`);

  try {
    const prompt = "character standing straight, symmetrical, slightly spread legs, symmetrical arms, front facing the viewer. make sure the ratio of leg to body is 1:1";
    const left = 1000;
    const right = 1000;
    const up = 0;
    const down = 2000;
    const creativity = 0.5;
    const seed = 0;
    const output_format = "png";

    console.log('Prompt sent to Stability API:', prompt);

    // Resize the image to 1024x1024
    const imagePath = path.resolve(pfpImage.path);
    const resizedImagePath = `${imagePath}-resized.png`;
    await sharp(imagePath)
      .resize(1024, 1024)
      .png()
      .toFile(resizedImagePath);

    console.log('Image successfully resized to 1024x1024:', resizedImagePath);

    const formData = new FormData();
    formData.append('image', fs.createReadStream(resizedImagePath));
    formData.append('prompt', prompt);
    formData.append('left', left);
    formData.append('right', right);
    formData.append('up', up);
    formData.append('down', down);
    formData.append('creativity', creativity);
    formData.append('seed', seed);
    formData.append('output_format', output_format);

    console.log('Sending request to Stability API...');

    const response = await axios.post('https://api.stability.ai/v2beta/stable-image/edit/outpaint', formData, {
      headers: {
        'Authorization': `Bearer ${process.env.DREAMSTUDIO_API_KEY}`,
        'Accept': 'image/*',
        ...formData.getHeaders(),
      },
      responseType: 'arraybuffer',
    });

    if (response.status === 200) {
      const fullBodyImagesFolder = path.join(__dirname, 'fullbodyimages');
      if (!fs.existsSync(fullBodyImagesFolder)) {
        console.log('Creating fullbodyimages directory...');
        fs.mkdirSync(fullBodyImagesFolder);
      } else {
        console.log('fullbodyimages directory already exists');
      }

      const outputImagePath = path.join(fullBodyImagesFolder, `${Date.now()}-fullbody.${output_format}`);
      fs.writeFileSync(outputImagePath, response.data);

      console.log('Successfully generated and saved image:', outputImagePath);
      const fullImageUrl = `${req.protocol}://${req.get('host')}/fullbodyimages/${path.basename(outputImagePath)}`;
      res.json({ imagePath: fullImageUrl });
    } else {
      res.status(500).json({ error: 'No images returned from Stability API', details: response.data });
    }

    fs.unlink(resizedImagePath, (err) => {
      if (err) console.error('Error deleting resized image:', err.message);
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error generating images',
      details: error.response?.data || error.message,
    });
  } finally {
    fs.unlink(pfpImage.path, (err) => {
      if (err) console.error('Error deleting uploaded file:', err.message);
    });
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

// Upload handler (local or cloud)
app.post('/upload-to-cloud', async (req, res) => {
  const { fileName } = req.body;
  const filePath = path.join(__dirname, 'fullbodyimages', fileName);

  if (!fs.existsSync(filePath)) {
    console.error('File does not exist:', filePath);
    return res.status(400).json({ error: 'File does not exist.' });
  } else {
    console.log('File exists, proceeding with upload:', filePath);
  }

  try {
    // Upload to Google Cloud Storage
    const storage = new Storage();
    const bucketName = process.env.GCS_BUCKET;

    // Prepend 'beamit' to the file name for the destination
    const destination = `fullbodyimages/beamit-${fileName}`; // Updated line

    console.log(`Uploading to bucket: ${bucketName}, file: ${fileName}`);
    await storage.bucket(bucketName).upload(filePath, {
      destination,
    });

    console.log(`File uploaded successfully to ${bucketName}/${destination}`);
    res.json({ message: `File successfully uploaded to Cloud Storage: ${destination}` });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Error uploading file', details: error.message });
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

// Start the backend server
app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
