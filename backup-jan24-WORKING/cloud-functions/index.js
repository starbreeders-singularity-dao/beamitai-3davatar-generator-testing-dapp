const axios = require("axios");
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

exports.onVideoUploaded = async (pubsubMessage, context) => {
  const message = JSON.parse(Buffer.from(pubsubMessage.data, 'base64').toString());
  console.log("Function triggered with message:", JSON.stringify(message));
  
  const file = message.name;
  const bucket = message.bucket;

  if (file.startsWith("dg-results/") && file.endsWith(".mp4")) {
    console.log(`New video detected: ${file}`);

    try {
      // Generate signed URL that expires in 1 hour
      const [signedUrl] = await storage
        .bucket(bucket)
        .file(file)
        .getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 60 * 60 * 1000, // 1 hour
        });

      const videoUrl = `https://storage.googleapis.com/${bucket}/${file}`;
      const currentNgrokUrl = "https://1a91-36-85-250-89.ngrok-free.app/api/videos";
      
      console.log("Sending notification to backend:", currentNgrokUrl);
      console.log("Video URL (signed):", signedUrl);
      
      const response = await axios.post(currentNgrokUrl, {
        videoUrl: signedUrl,
        fileName: file
      });

      console.log("Backend response:", response.status, response.data);
      console.log("Backend notified successfully");
    } catch (error) {
      console.error("Error notifying backend:", error.message);
      console.error("Full error:", JSON.stringify(error));
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
    }
  }
};
