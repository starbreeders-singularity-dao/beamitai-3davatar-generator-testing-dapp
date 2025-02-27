import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Define context type
interface WalletContextType {
  walletAddress: string | null;
  setWalletAddress: React.Dispatch<React.SetStateAction<string | null>>; // FIXED TYPE
  disconnectWallet: () => void;
}

// Create the context with an initial undefined value
const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
 // localStorage.getItem("walletAddress") || null


 useEffect(() => {
  const savedAddress = localStorage.getItem("walletAddress");
  if (savedAddress) {
    setWalletAddress(savedAddress);
  }
}, []);

  // Function to detect wallet switch
  const addWalletListener = () => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          localStorage.setItem("walletAddress", accounts[0]);
        } else {
          setWalletAddress(null);
          localStorage.removeItem("walletAddress");
        }
      });
    }
  };


  // Function to check if a wallet is already connected
  const getCurrentWalletConnected = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          localStorage.setItem("walletAddress", accounts[0]);
        }
      } catch (error) {
        console.error("Error fetching wallet:", error);
      }
    }
  };

  useEffect(() => {
    getCurrentWalletConnected();
    addWalletListener();
  }, []);

  
  useEffect(() => {
    // Save wallet address in localStorage when updated
    if (walletAddress) {
      localStorage.setItem("walletAddress", walletAddress);
    } else {
      localStorage.removeItem("walletAddress");
    }
  }, [walletAddress]);

  // Function to disconnect wallet
  const disconnectWallet = () => {
    setWalletAddress(null);
    localStorage.removeItem("walletAddress");
  };

  return (
    <WalletContext.Provider value={{ walletAddress, setWalletAddress, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook to use the wallet context
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
