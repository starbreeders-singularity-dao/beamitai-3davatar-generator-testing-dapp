
const express = require('express');
const router = express.Router();
const { Network, Alchemy } = require("alchemy-sdk");
const path = require('path');
const fs = require('fs');
const { Storage } = require('@google-cloud/storage');

// Initialize Google Cloud Storage
const storage = new Storage({
  keyFilename: path.join(__dirname, '../beamit-service-account.json'),
  projectId: 'beamit-prototype'
});

// Alchemy SDK configuration
const getAlchemyConfig = (network = 'scroll-sepolia') => {
  // Map network names to Alchemy Network enums
  const networkMap = {
    'scroll': Network.SCROLL,
    'scroll-sepolia': Network.SCROLL_SEPOLIA,
    'ethereum': Network.ETH_MAINNET,
    'sepolia': Network.ETH_SEPOLIA,
  };

  return {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: networkMap[network] || Network.SCROLL_SEPOLIA,
  };
};

// Initialize Alchemy SDK
const alchemy = new Alchemy(getAlchemyConfig());

// Get NFT data from Alchemy API
router.get('/api/nft/:contractAddress/:tokenId', async (req, res) => {
  const { contractAddress, tokenId } = req.params;
  
  try {
    // Validate inputs
    if (!contractAddress || !tokenId) {
      return res.status(400).json({ error: 'Contract address and token ID are required' });
    }

    console.log(`Fetching NFT data for contract: ${contractAddress}, token: ${tokenId}`);
    
    // Get NFT metadata from Alchemy
    const nftMetadata = await alchemy.nft.getNftMetadata(
      contractAddress,
      tokenId
    );
    
    res.json(nftMetadata);
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    res.status(500).json({ error: 'Failed to fetch NFT metadata', details: error.message });
  }
});

// Get all NFTs for a wallet
router.get('/api/nfts/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;
  
  try {
    // Validate input
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    console.log(`Fetching NFTs for wallet: ${walletAddress}`);
    
    // Get NFTs from Alchemy
    const nftsForOwner = await alchemy.nft.getNftsForOwner(walletAddress);
    
    res.json(nftsForOwner);
  } catch (error) {
    console.error('Error fetching NFTs for wallet:', error);
    res.status(500).json({ error: 'Failed to fetch NFTs', details: error.message });
  }
});

// Get 3D model for an NFT
router.get('/api/models/:tokenId', async (req, res) => {
  const tokenId = req.params.tokenId;
  console.log(`Retrieving 3D model for NFT ID: ${tokenId}`);

  try {
    // Set appropriate headers for GLB files
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // Check if we have a local file first
    const localFilePath = path.join(__dirname, '../3dmesh', `nft-${tokenId}.glb`);
    if (fs.existsSync(localFilePath)) {
      console.log(`Serving local GLB file: ${localFilePath}`);
      return fs.createReadStream(localFilePath).pipe(res);
    }

    // If not found locally, check Google Cloud Storage
    console.log('File not found locally, checking Google Cloud Storage...');
    const bucket = storage.bucket('fullbody-images');
    const [files] = await bucket.getFiles({ prefix: 'dg-results/' });
    
    // Look for file matching the token ID
    const glbFile = files.find(file => 
      file.name.endsWith('.glb') && file.name.includes(`nft-${tokenId}`)
    );

    if (!glbFile) {
      // If no specific file found, return the latest GLB file (temporary fallback)
      const latestGlbFile = files
        .filter(file => file.name.endsWith('.glb'))
        .sort((a, b) => b.metadata.timeCreated - a.metadata.timeCreated)[0];
      
      if (latestGlbFile) {
        console.log(`No specific GLB found for token ${tokenId}, serving latest: ${latestGlbFile.name}`);
        return latestGlbFile.createReadStream().pipe(res);
      }
      
      return res.status(404).json({ error: 'No 3D model found for this NFT' });
    }

    console.log(`Serving GLB from Cloud Storage: ${glbFile.name}`);
    glbFile.createReadStream().pipe(res);
  } catch (error) {
    console.error('Error retrieving 3D model:', error);
    res.status(500).json({ error: 'Failed to retrieve 3D model', details: error.message });
  }
});

module.exports = router;
