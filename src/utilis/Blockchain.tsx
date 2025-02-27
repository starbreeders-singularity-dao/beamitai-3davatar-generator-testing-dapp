import { ethers } from "ethers";
import abi from "../nftabi.json"; 
import { BrowserProvider } from "ethers";


const CONTRACT_ABI = abi;
const CONTRACT_ADDRESS = "0x28571421e389f0553b5c261dc33f7b22bbb1b0e3";

export const updateMessage = async (address: string | null, message: string) => {
  if (!window.ethereum) {
    return {
      status: "💡 Metamask is not installed. Please install it to use this feature.",
    };
  }

  if (!address) {
    return {
      status: "💡 Connect your Metamask wallet to update the message on the blockchain.",
    };
  }

  if (message.trim() === "") {
    return {
      status: "❌ Your message cannot be an empty string.",
    };
  }

  try {
    // Create a provider and signer
    const provider = new BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []); // Ensure user is connected

    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    // Send transaction
    const tx = await contract.updateMessage(message);
    await tx.wait();

    return { status: "✅ Message updated successfully!" };
  } catch (error: any) {
    console.error("Error updating message:", error);
    return { status: `❌ Error: ${error.message || "Transaction failed."}` };
  }
};
