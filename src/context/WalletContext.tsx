import { createContext, useContext, useState, ReactNode } from "react";

// Define context type
interface WalletContextType {
  walletAddress: string | null;
  setWalletAddress: React.Dispatch<React.SetStateAction<string | null>>; // FIXED TYPE
}

// Create the context with an initial undefined value
const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  return (
    <WalletContext.Provider value={{ walletAddress, setWalletAddress }}>
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
