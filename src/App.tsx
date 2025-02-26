import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, linea, lineaSepolia } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";
import Home from "./pages/Home";
import LastPage from "./pages/LastPage";
import SelectNft from "./pages/SelectNft";
import Nfts from "./pages/Nfts";
import { WalletProvider } from "../src/context/WalletContext"; 
import "./App.css";

// Correct Wagmi Config
const wagmiConfig = createConfig({
  connectors: [metaMask()],
  chains: [mainnet, linea, lineaSepolia],
  transports: {
    [mainnet.id]: http(),
    [linea.id]: http(),
    [lineaSepolia.id]: http(),
  },
  ssr: false, // Disable SSR if using Next.js
});

const queryClient = new QueryClient(); // Initialize React Query client

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider> {/* Wrap WalletProvider here */}
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/last" element={<LastPage />} />
              <Route path="/select-nft" element={<SelectNft />} />
              <Route path="/nfts" element={<Nfts />} />
            </Routes>
          </Router>
        </WalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
