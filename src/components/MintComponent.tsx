import { useState } from "react";
import useNFTs from "./NftCard";
import { mintNFT } from "../utilis/MintNfts";

const MintComponent = () => {
  const contractAddress = "0x28571421e389f0553b5c261dc33f7b22bbb1b0e3"; 
  const { nfts, loading, error, connectWallet, userAddress } = useNFTs(contractAddress, "");
  const [selectedNFT, setSelectedNFT] = useState<string | null>(null);
  const [minting, setMinting] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleMint = async () => {
    if (!selectedNFT || !userAddress) return;

    try {
      setMinting(true);
      const tx = await mintNFT(userAddress, selectedNFT);
      setTxHash(tx);
    } catch (error) {
      console.error("Minting failed:", error);
    } finally {
      setMinting(false);
    }
  };

  return (
    <div>
      <h2>Mint Your 3D Avatar</h2>
      <button onClick={connectWallet}>Connect Wallet</button>

      {loading && <p>Loading NFTs...</p>}
      {error && <p>Error: {error}</p>}

      <div>
        {nfts.map((nft, index) => (
          <div key={index} onClick={() => setSelectedNFT(nft.metadata.image)}>
            <img src={nft.metadata.image} alt={`NFT ${index}`} width={100} />
          </div>
        ))}
      </div>

      <button onClick={handleMint} disabled={!selectedNFT || minting}>
        {minting ? "Minting..." : "Mint 3D NFT"}
      </button>

      {txHash && (
        <p>
          🎉 Minted! <a href={`https://etherscan.io/tx/${txHash}`}>View on Etherscan</a>
        </p>
      )}
    </div>
  );
};

export default MintComponent;
