/**
 * Pinata IPFS Upload Handler for BeamitAI
 */

const PINATA_JWT = process.env.REACT_APP_PINATA_JWT;
const PINATA_API = 'https://api.pinata.cloud';

// Test the connection
const testPinataConnection = async () => {
    try {
        const response = await fetch(`${PINATA_API}/data/testAuthentication`, {
            headers: {
                'Authorization': `Bearer ${PINATA_JWT}`
            }
        });
        const data = await response.json();
        console.log('Pinata connection:', data);
        return response.ok;
    } catch (error) {
        console.error('Pinata connection failed:', error);
        return false;
    }
};

export const uploadToIPFS = async (glbUrl, originalNFT) => {
    try {
        console.log('Starting upload process...');

        // Test connection first
        const isConnected = await testPinataConnection();
        if (!isConnected) {
            throw new Error('Failed to connect to Pinata');
        }

        // 1. Fetch the GLB file
        const glbResponse = await fetch(glbUrl);
        if (!glbResponse.ok) {
            throw new Error(`Failed to fetch GLB: ${glbResponse.status}`);
        }
        const glbBlob = await glbResponse.blob();

        // 2. Create metadata
        const metadata = {
            name: `BeamitAI Avatar #${Date.now()}`,
            description: 'AI-Generated 3D Avatar',
            originalNFT: originalNFT
        };

        // 3. Upload GLB to Pinata
        const formData = new FormData();
        formData.append('file', glbBlob, 'avatar.glb');
        formData.append('pinataMetadata', JSON.stringify({
            name: `beamit-avatar-${Date.now()}`,
            keyvalues: {
                type: '3d-avatar',
                originalNFTId: originalNFT.tokenId
            }
        }));

        console.log('Uploading to Pinata...');
        const uploadResponse = await fetch(`${PINATA_API}/pinning/pinFileToIPFS`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PINATA_JWT}`
            },
            body: formData
        });

        if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            console.error('Upload failed:', error);
            throw new Error(`Upload failed: ${JSON.stringify(error)}`);
        }

        const result = await uploadResponse.json();
        console.log('Upload successful:', result);

        // Returns format: ipfs://Qm...
        return `ipfs://${result.IpfsHash}`;

    } catch (error) {
        console.error('Upload process failed:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
};
