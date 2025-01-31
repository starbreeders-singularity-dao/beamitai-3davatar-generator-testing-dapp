const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const FormData = require('form-data');
const app = express();
const port = 5001;

require('dotenv').config();

// CORS Configuration
const allowedOrigins = ['http://localhost:3000'];
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Middleware to parse JSON
app.use(express.json());

// Set up multer for file uploads to the 'pfp' folder
const upload = multer({
  dest: 'pfp/', // Storing files in 'pfp' directory
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
    const up = 0;  // No upward outpainting as per the settings
    const down = 2000;
    const creativity = 0.5;
    const seed = 0;
    const output_format = "png"; 

    console.log('Prompt sent to Stability API:');
    console.log(prompt);

    // Resize the image to 1024x1024
    const imagePath = path.resolve(pfpImage.path);
    const resizedImagePath = `${imagePath}-resized.png`;
    await sharp(imagePath)
      .resize(1024, 1024)
      .png()
      .toFile(resizedImagePath);

    console.log('Image successfully resized to 1024x1024:', resizedImagePath);

    // Prepare API request to Stability API for outpainting
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

    // Request the raw image format
    const response = await axios.post('https://api.stability.ai/v2beta/stable-image/edit/outpaint', formData, {
      headers: {
        'Authorization': `Bearer ${process.env.DREAMSTUDIO_API_KEY}`,
        'Accept': 'image/*', // Requesting the raw image
        ...formData.getHeaders(),
      },
      responseType: 'arraybuffer', // Ensure response is in binary format
    });

    if (response.status === 200) {
      // Define the folder to store full body images
      const fullBodyImagesFolder = path.join(__dirname, 'fullbodyimages');

      // Ensure the folder exists
      if (!fs.existsSync(fullBodyImagesFolder)) {
        fs.mkdirSync(fullBodyImagesFolder);
      }

      const outputImagePath = path.join(fullBodyImagesFolder, `${Date.now()}-fullbody.${output_format}`);
      fs.writeFileSync(outputImagePath, response.data); // Save the binary image

      console.log('Successfully generated and saved image:', outputImagePath);

      // Send the full URL of the saved image to the frontend
      const fullImageUrl = `${req.protocol}://${req.get('host')}/fullbodyimages/${path.basename(outputImagePath)}`;
      res.json({ imagePath: fullImageUrl });
    } else {
      console.error('No images returned from API:', response.data);
      res.status(500).json({ error: 'No images returned from Stability API', details: response.data });
    }

    // Clean up resized image
    fs.unlink(resizedImagePath, (err) => {
      if (err) console.error('Error deleting resized image:', err.message);
    });
  } catch (error) {
    console.error('Error generating images:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Error generating images',
      details: error.response?.data || error.message,
    });
  } finally {
    fs.unlink(pfpImage.path, (err) => {
      if (err) {
        console.error('Error deleting uploaded file:', err.message);
      }
    });
  }
});

// Endpoint to fetch images from the 'pfp' folder
app.get('/pfp', (req, res) => {
  const pfpDir = path.join(__dirname, 'pfp');
  fs.readdir(pfpDir, (err, files) => {
    if (err) {
      console.error('Error reading pfp directory:', err.message);
      return res.status(500).json({ error: 'Failed to fetch images.' });
    }

    const imageUrls = files
      .filter(file => /\.(png|jpg|jpeg|gif)$/i.test(file))
      .map(file => `/pfp/${file}`); // Note the `/pfp/` prefix is added here

    res.json({ images: imageUrls });
  });
});

// Serve the 'pfp' folder as static content
app.use('/pfp', express.static(path.join(__dirname, 'pfp')));

// Serve the 'fullbodyimages' folder as static content
app.use('/fullbodyimages', express.static(path.join(__dirname, 'fullbodyimages')));

// Start the backend server
app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
