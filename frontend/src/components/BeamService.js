import React, { useState } from 'react';
import ethers from 'ethers';
import NFTMinter from './NFTMinter';

const BeamService = ({ selectedNFT }) => {
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedGlbUrl, setGeneratedGlbUrl] = useState(null);
    const [paymentComplete, setPaymentComplete] = useState(false);
    
    const SERVICE_PRICE = ethers.parseEther("0.05"); // Example: 0.05 ETH for 3D generation

    const payForService = async () => {
        setIsLoading(true);
        try {
            if (!window.ethereum) throw new Error('Please install MetaMask');

            setStatus('Initiating payment...');
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            
            // Create payment transaction
            const tx = await signer.sendTransaction({
                to: "YOUR_PAYMENT_RECEIVER_ADDRESS", // Your service wallet
                value: SERVICE_PRICE,
                // Optional: Include some data to identify the payment
                data: ethers.hexlify(ethers.toUtf8Bytes(`beam_service_${selectedNFT.id}`))
            });

            setStatus('Processing payment...');
            await tx.wait();
            
            // After payment confirmation, start 3D generation
            setStatus('Payment confirmed! Starting 3D generation...');
            const response = await fetch('/api/generate-3d', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nftId: selectedNFT.id,
                    txHash: tx.hash, // Proof of payment
                })
            });

            if (!response.ok) throw new Error('Generation failed');
            
            const { glbUrl } = await response.json();
            setGeneratedGlbUrl(glbUrl);
            setPaymentComplete(true);
            setStatus('3D model generated successfully! Ready to mint.');

        } catch (error) {
            console.error('Service payment error:', error);
            setStatus(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            {!paymentComplete ? (
                <div>
                    <h3>Create Your 3D Avatar</h3>
                    <p>Service Fee: {ethers.formatEther(SERVICE_PRICE)} ETH</p>
                    <button 
                        onClick={payForService}
                        disabled={isLoading}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: isLoading ? '#cccccc' : '#FF1493',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: isLoading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isLoading ? 'Processing...' : 'Pay & Generate 3D'}
                    </button>
                </div>
            ) : (
                <NFTMinter 
                    glbUrl={generatedGlbUrl}
                    originalNFT={selectedNFT}
                    onBeamAnother={() => {
                        setPaymentComplete(false);
                        setGeneratedGlbUrl(null);
                    }}
                />
            )}
            
            {status && (
                <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    borderRadius: '5px',
                    backgroundColor: status.includes('Error') ? '#ffe6e6' : '#e6ffe6',
                    color: status.includes('Error') ? '#cc0000' : '#006600'
                }}>
                    {status}
                </div>
            )}
        </div>
    );
};

export default BeamService;
