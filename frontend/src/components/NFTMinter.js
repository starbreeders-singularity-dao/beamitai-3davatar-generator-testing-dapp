import { ethers } from 'ethers';
import { useState } from 'react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contracts/BeamitAIGen1';
import { uploadToIPFS } from '../utils/ipfsHandler';

const NFTMinter = ({ glbUrl, originalNFT, onBeamAnother }) => {
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [txHash, setTxHash] = useState('');
    const [isMinted, setIsMinted] = useState(false);

    const PINK_COLOR = '#FF1493';

    const disconnectWallet = async () => {
        if (window.ethereum) {
            setStatus('Disconnecting wallet...');
            try {
                await window.ethereum.request({
                    method: "wallet_requestPermissions",
                    params: [{
                        eth_accounts: {}
                    }]
                });
                setStatus('Wallet disconnected');
                setIsMinted(false);
                setTxHash('');
            } catch (error) {
                console.error('Error disconnecting:', error);
                setStatus('Error disconnecting wallet');
            }
        }
    };

    const mintNFT = async () => {
        setIsLoading(true);
        try {
            if (!window.ethereum) {
                throw new Error('Please install MetaMask');
            }

            setStatus('Checking network...');
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== '0x13882') {
                setStatus('Switching to Polygon Amoy...');
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x13882' }],
                });
            }

            setStatus('Connecting wallet...');
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            const userAddress = accounts[0];

            setStatus('Uploading to IPFS...');
            const tokenURI = await uploadToIPFS(glbUrl, originalNFT);
            setStatus('IPFS Upload successful! ✅');

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                signer
            );

            const nonce = await provider.getTransactionCount(userAddress);
            const tokenId = ethers.hexlify(
                ethers.toUtf8Bytes(userAddress + nonce.toString())
            );

            setStatus('Estimating gas...');
            const gasEstimate = await contract.mint.estimateGas(
                userAddress,
                tokenURI,
                tokenId,
                "0x00"
            );

            setStatus('Minting NFT...');
            const tx = await contract.mint(
                userAddress,
                tokenURI,
                tokenId,
                "0x00",
                {
                    gasLimit: Math.floor(Number(gasEstimate) * 1.2)
                }
            );

            setTxHash(tx.hash);
            setStatus('Transaction sent! Waiting for confirmation...');
            
            const receipt = await tx.wait();
            setStatus('NFT Minted Successfully! 🎉');
            setIsMinted(true);

            return receipt;

        } catch (error) {
            console.error('Minting error:', error);
            setStatus(`Error: ${error.message}`);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            {!isMinted ? (
                <button 
                    onClick={mintNFT}
                    disabled={isLoading}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: isLoading ? '#cccccc' : PINK_COLOR,
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        minWidth: '150px'
                    }}
                >
                    {isLoading ? 'Processing...' : 'Mint NFT'}
                </button>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                    <button
                        onClick={disconnectWallet}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: PINK_COLOR,
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            minWidth: '150px'
                        }}
                    >
                        Disconnect MetaMask
                    </button>
                    <button
                        onClick={onBeamAnother}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: PINK_COLOR,
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            minWidth: '150px'
                        }}
                    >
                        Beam Another Avatar
                    </button>
                </div>
            )}
            
            {status && (
                <div 
                    style={{
                        marginTop: '10px',
                        padding: '10px',
                        borderRadius: '5px',
                        backgroundColor: status.includes('Error') ? '#ffe6e6' : '#e6ffe6',
                        color: status.includes('Error') ? '#cc0000' : '#006600',
                        maxWidth: '300px',
                        textAlign: 'center'
                    }}
                >
                    {status}
                </div>
            )}

            {txHash && (
                <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    borderRadius: '5px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    maxWidth: '300px',
                    wordBreak: 'break-all',
                    textAlign: 'center'
                }}>
                    <div>Transaction Hash:</div>
                    <a 
                        href={`https://amoy.polygonscan.com/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: 'white',
                            textDecoration: 'underline'
                        }}
                    >
                        {txHash.slice(0, 6)}...{txHash.slice(-4)}
                    </a>
                </div>
            )}
        </div>
    );
};

export default NFTMinter;
