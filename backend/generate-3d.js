const verifyPayment = async (txHash) => {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const tx = await provider.getTransaction(txHash);
    
    // Verify payment amount and recipient
    return (
        tx.to.toLowerCase() === YOUR_PAYMENT_ADDRESS.toLowerCase() &&
        tx.value >= SERVICE_PRICE
    );
};

app.post('/api/generate-3d', async (req, res) => {
    try {
        const { nftId, txHash } = req.body;
        
        // Verify payment
        const isValidPayment = await verifyPayment(txHash);
        if (!isValidPayment) {
            return res.status(400).json({ error: 'Invalid payment' });
        }

        // Generate 3D model
        const glbUrl = await generate3DModel(nftId);
        
        res.json({ glbUrl });
    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({ error: 'Generation failed' });
    }
});
