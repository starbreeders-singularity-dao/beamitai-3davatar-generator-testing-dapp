// App.js

import React, { useEffect, useState } from 'react';

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [nfts, setNfts] = useState([]);

  // Connect to the wallet
  useEffect(() => {
    const connectWallet = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
          });
          setWalletAddress(accounts[0]);
        } catch (error) {
          console.error('Error connecting to wallet:', error);
        }
      } else {
        console.error('No Ethereum provider found');
      }
    };

    connectWallet();
  }, []);

  // Fetch NFTs from OpenSea when walletAddress changes
  useEffect(() => {
    const fetchNFTsFromOpenSea = async () => {
      if (walletAddress) {
        try {
          console.log('OpenSea API Key:', process.env.REACT_APP_OPENSEA_API_KEY);

          const apiKey = process.env.REACT_APP_OPENSEA_API_KEY;
          const chain = 'ethereum'; // Change to 'polygon' if you're using Polygon network

          const response = await fetch(
            `https://api.opensea.io/api/v2/chain/${chain}/account/${encodeURIComponent(walletAddress)}/nfts?limit=50`,
            {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'X-API-KEY': apiKey,
              },
            }
          );

          console.log('Response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response from OpenSea:', errorText);
            throw new Error(`Error ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          console.log('OpenSea NFTs:', data);

          // Update the state with the NFTs
          setNfts(data.nfts || []);
        } catch (error) {
          console.error('Error fetching NFTs from OpenSea:', error.message);
          setNfts([]);
        }
      }
    };

    fetchNFTsFromOpenSea();
  }, [walletAddress]);

  return (
    <div>
      <h1>NFT Gallery</h1>
      {walletAddress ? (
        <div>
          <p>Connected Wallet: {walletAddress}</p>
          {nfts && nfts.length > 0 ? (
            nfts.map((nft) => {
              // Get the title
              const title = nft.name || `Token ID: ${nft.identifier}` || 'Untitled NFT';

              // Get the image URL
              let imageUrl = nft.image_url || nft.display_image_url || nft.display_animation_url;

              // Handle potential missing images
              if (!imageUrl) {
                imageUrl = 'https://via.placeholder.com/200?text=No+Image';
              }

              return (
                <div key={`${nft.contract}-${nft.identifier}`}>
                  <h2>{title}</h2>
                  {imageUrl ? (
                    <img src={imageUrl} alt={title} width="200" />
                  ) : (
                    <p>No image available</p>
                  )}
                </div>
              );
            })
          ) : (
            <p>Loading NFTs or no NFTs found.</p>
          )}
        </div>
      ) : (
        <p>Connecting to wallet...</p>
      )}
    </div>
  );
}

export default App;
