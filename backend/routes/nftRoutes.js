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
const getAlchemyConfig = () => {
  // Use the Network enum for Ethereum mainnet since Scroll is not enabled for this API key
  console.log('Configuring Alchemy for Ethereum mainnet');
  
  // Debug log the API key (masked for security)
  const apiKey = process.env.ALCHEMY_API_KEY;
  console.log('Alchemy API Key defined:', apiKey ? `Yes (${apiKey.substring(0, 4)}...)` : 'No (undefined)');
  
  return {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET  // Using Ethereum mainnet since Scroll isn't enabled for this API key
  };
};

// Initialize Alchemy SDK with Ethereum mainnet explicitly
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

    console.log(`Fetching NFTs for wallet: ${walletAddress} on Ethereum mainnet`);
    console.log('Using network:', Network.ETH_MAINNET);
    
    try {
      // Log the request we're making to Alchemy
      console.log('Making request to Alchemy API with:', {
        walletAddress,
        network: Network.ETH_MAINNET,
        apiKeyDefined: process.env.ALCHEMY_API_KEY ? 'Yes' : 'No'
      });
      
      // Get NFTs from Alchemy with a timeout - include more parameters
      const nftsForOwner = await Promise.race([
        alchemy.nft.getNftsForOwner(
          walletAddress, 
          { 
            pageSize: 100,
            excludeFilters: [],  // Don't exclude anything
            pageKey: undefined,  // Start from the beginning
            orderBy: "transferTime"  // Order by most recently transferred
          }
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Alchemy API timeout')), 15000))
      ]);
      
      const nftCount = nftsForOwner.ownedNfts?.length || 0;
      
      console.log(`Found ${nftCount} NFTs for wallet on Ethereum mainnet`);
      console.log('Response keys:', Object.keys(nftsForOwner));
      
      // If no NFTs were found, log a clearer message
      if (nftCount === 0) {
        console.log('No NFTs found for this wallet on Ethereum mainnet.');
      } else {
        // Log the first NFT for debugging - more complete log
        console.log('First NFT contract:', JSON.stringify(nftsForOwner.ownedNfts[0].contract, null, 2));
        console.log('First NFT title:', nftsForOwner.ownedNfts[0].title);
        console.log('First NFT name:', nftsForOwner.ownedNfts[0].name);
        console.log('First NFT tokenId:', nftsForOwner.ownedNfts[0].tokenId);
        
        // Check for image URLs - common issue
        const hasImageUrl = nftsForOwner.ownedNfts[0].image?.originalUrl || 
                           nftsForOwner.ownedNfts[0].image?.cachedUrl ||
                           nftsForOwner.ownedNfts[0].raw?.metadata?.image;
        console.log('First NFT has image URL:', hasImageUrl ? 'Yes' : 'No');
        if (hasImageUrl) {
          console.log('Image URL:', 
            nftsForOwner.ownedNfts[0].image?.originalUrl || 
            nftsForOwner.ownedNfts[0].image?.cachedUrl ||
            nftsForOwner.ownedNfts[0].raw?.metadata?.image
          );
        }
      }
      
      res.json(nftsForOwner);
    } catch (alchemyError) {
      console.error('Alchemy API error:', alchemyError);
      console.error('Error details:', alchemyError.message);
      
      // Return a friendly error response with empty NFTs array for frontend compatibility
      return res.json({ 
        ownedNfts: [], 
        totalCount: 0,
        error: {
          message: `Error fetching NFTs from Alchemy: ${alchemyError.message}`,
          details: alchemyError.toString()
        }
      });
    }
  } catch (error) {
    console.error('Error fetching NFTs for wallet:', error);
    // Return a structured error response for better frontend handling
    res.status(500).json({ 
      error: 'Failed to fetch NFTs', 
      details: error.message,
      ownedNfts: [] 
    });
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
