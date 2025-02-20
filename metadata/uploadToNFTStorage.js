// metadata/uploadToNFTStorage.js
import { NFTStorage, File } from 'nft.storage';

const client = new NFTStorage({ token: '61abf0f2.eaf84cc2474f4659ade1b85f6b9b81a5' });

export async function uploadToNFTStorage(metadata) {
    const { name, description, image } = metadata;
    const metadataJson = {
        name,
        description,
        image: new File([image], 'image.png', { type: 'image/png' })
    };
    const cid = await client.store(metadataJson);
    return `ipfs://${cid}`;
}
