require('dotenv').config({ path: require('path').join(__dirname, '.env.backend') });
const { Network, Alchemy } = require('alchemy-sdk');

async function testAlchemySDK() {
  console.log('Environment API Key:', process.env.ALCHEMY_API_KEY ? `Found (${process.env.ALCHEMY_API_KEY.substring(0, 4)}...)` : 'Not found');
  
  // Configure Alchemy for Ethereum mainnet
  const ethConfig = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET
  };

  console.log('\n===== ETHEREUM MAINNET TEST =====');
  console.log('Alchemy configuration:', {
    apiKey: process.env.ALCHEMY_API_KEY ? '✓ (defined)' : '✗ (undefined)', 
    network: ethConfig.network
  });
  
  try {
    // Initialize Alchemy SDK for Ethereum
    const ethAlchemy = new Alchemy(ethConfig);
    
    // Test wallet - this is a sample wallet that might not have NFTs
    // Replace with a known wallet that has NFTs on Ethereum mainnet
    const testWallet = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'; // vitalik.eth
    
    console.log(`\nFetching NFTs for wallet: ${testWallet} on Ethereum mainnet...`);
    
    // Get NFTs from Alchemy for Ethereum
    const ethNfts = await ethAlchemy.nft.getNftsForOwner(testWallet);
    
    console.log(`Found ${ethNfts.ownedNfts?.length || 0} NFTs for wallet on Ethereum mainnet`);
    
    if (ethNfts.ownedNfts?.length > 0) {
      console.log('\nFirst NFT details from Ethereum:');
      console.log(JSON.stringify(ethNfts.ownedNfts[0], null, 2));
    } else {
      console.log('No NFTs found for this wallet on Ethereum mainnet.');
    }
  } catch (error) {
    console.error('Error in Ethereum Mainnet test:', error);
  }

  // Now test Scroll mainnet
  const scrollConfig = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.SCROLL_MAINNET
  };

  console.log('\n===== SCROLL MAINNET TEST =====');
  console.log('Alchemy configuration:', {
    apiKey: process.env.ALCHEMY_API_KEY ? '✓ (defined)' : '✗ (undefined)', 
    network: scrollConfig.network
  });
  
  try {
    // Initialize Alchemy SDK for Scroll
    const scrollAlchemy = new Alchemy(scrollConfig);
    
    // Test wallet - this is a sample wallet that might not have NFTs
    const testWallet = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'; // vitalik.eth
    
    console.log(`\nFetching NFTs for wallet: ${testWallet} on Scroll mainnet...`);
    
    // Get NFTs from Alchemy for Scroll
    const scrollNfts = await scrollAlchemy.nft.getNftsForOwner(testWallet);
    
    console.log(`Found ${scrollNfts.ownedNfts?.length || 0} NFTs for wallet on Scroll mainnet`);
    
    if (scrollNfts.ownedNfts?.length > 0) {
      console.log('\nFirst NFT details from Scroll:');
      console.log(JSON.stringify(scrollNfts.ownedNfts[0], null, 2));
    } else {
      console.log('No NFTs found for this wallet on Scroll mainnet.');
    }
  } catch (error) {
    console.error('Error in Scroll Mainnet test:', error);
  }
}

testAlchemySDK(); 