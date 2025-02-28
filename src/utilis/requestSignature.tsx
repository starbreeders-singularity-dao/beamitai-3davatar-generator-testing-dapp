export const requestSignature = async (userAddress: string, tokenId: string) => {
    try {
      const response = await fetch("https://your-backend.com/api/mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userAddress, tokenId }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to get signature from backend");
      }
  
      return data; // Returns { signature, ipfsHash, originalNFTAddress, originalNFTId, networkId }
    } catch (error: any) {
      console.error("Error requesting signature:", error);
      throw error;
    }
  };
  