// src/components/NFTGallery.js
import React, { useEffect, useState } from 'react';
import { Network, Alchemy } from 'alchemy-sdk';

function NFTGallery({ account, onNFTSelected }) {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) {
      fetchNFTs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const fetchNFTs = async () => {
    setLoading(true);
    try {
      const settings = {
        apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
        network: Network.ETH_MAINNET,
      };

      const alchemy = new Alchemy(settings);

      // Fetch NFTs for the connected account
      const nftsForOwner = await alchemy.nft.getNftsForOwner(account);

      setNfts(nftsForOwner.ownedNfts);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Your NFTs</h2>
      {loading ? (
        <p>Loading NFTs...</p>
      ) : nfts.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {nfts.map((nft, index) => (
            <div key={index} style={{ margin: '10px', width: '150px' }}>
              <img
                src={nft.media[0]?.gateway || nft.media[0]?.thumbnail}
                alt={nft.title || 'NFT Image'}
                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
              />
              <p>{nft.title || 'Unnamed NFT'}</p>
              <button onClick={() => onNFTSelected(nft)}>Select NFT</button>
            </div>
          ))}
        </div>
      ) : (
        <p>No NFTs found for this account.</p>
      )}
    </div>
  );
}

export default NFTGallery;
