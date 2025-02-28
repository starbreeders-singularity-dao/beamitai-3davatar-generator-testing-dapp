// import { useState } from "react";

// const WalletConnect = () => {
//   const [showWallets, setShowWallets] = useState(false);

//   // Define valid network types
//   type NetworkType = "scroll" | "eth" | "bsc";

//   const networks: Record<NetworkType, any> = {
//     scroll: {
//       chainId: "0x82750", // Scroll Mainnet Chain ID (Confirm this is correct)
//       chainName: "Scroll",
//       rpcUrls: ["https://rpc.scroll.io"],
//       nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
//       blockExplorerUrls: ["https://scrollscan.com/"],
//     },
//     eth: {
//       chainId: "0x1", // Ethereum Mainnet
//       chainName: "Ethereum",
//       rpcUrls: ["https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY"], // Use your Infura Key
//       nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
//       blockExplorerUrls: ["https://etherscan.io/"],
//     },
//     bsc: {
//       chainId: "0x38", // BSC Mainnet
//       chainName: "Binance Smart Chain",
//       rpcUrls: ["https://bsc-dataseed.binance.org/"],
//       nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
//       blockExplorerUrls: ["https://bscscan.com/"],
//     },
//   };

//   const connectToNetwork = async (network: NetworkType) => {
//     if (!window.ethereum) {
//       alert("Please install MetaMask!");
//       return;
//     }

//     try {
//       // Request account access
//       await window.ethereum.request({ method: "eth_requestAccounts" });

//       // Try switching network first
//       try {
//         await window.ethereum.request({
//           method: "wallet_switchEthereumChain",
//           params: [{ chainId: networks[network].chainId }],
//         });
//         console.log(`Switched to ${network}`);
//       } catch (error: any) {
//         if (error.code === 4902) {
//           // If network is not added, add it
//           await window.ethereum.request({
//             method: "wallet_addEthereumChain",
//             params: [networks[network]],
//           });
//           console.log(`Added and switched to ${network}`);
//         } else {
//           console.error(`Error switching to ${network}:`, error);
//         }
//       }
//     } catch (error) {
//       console.error(`Error connecting to ${network}:`, error);
//     }
//   };

//   return (
//     <div className="p-4 bg-white shadow-lg rounded-lg w-80">
//       <h2 className="text-xl font-bold mb-4">Connect Wallet</h2>

//       {!showWallets ? (
//         <>
//           <button
//             className="w-full py-2 mb-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
//             onClick={() => setShowWallets(true)}
//           >
//             Show Wallets
//           </button>

//           <button
//             className="w-full py-2 mb-2 flex items-center justify-center bg-pink-500 text-white hover:bg-black rounded-lg"
//             onClick={() => connectToNetwork("scroll")}
//           >
//             <img src="/scroll.png" alt="Scroll" className="w-6 h-6 mr-2" /> Scroll
//           </button>
//         </>
//       ) : (
//         <>
//           <button
//             className="w-full py-2 mb-2 flex items-center justify-center bg-pink-500 text-white hover:bg-black rounded-lg"
//             onClick={() => connectToNetwork("eth")}
//           >
//             <img src="/eth.png" alt="MetaMask" className="w-6 h-6 mr-2" /> MetaMask (Ethereum)
//           </button>

//           <button
//             className="w-full py-2 mb-2 flex items-center justify-center bg-pink-500 text-white hover:bg-black rounded-lg"
//             onClick={() => connectToNetwork("bsc")}
//           >
//             <img src="/bsc.png" alt="BSC" className="w-6 h-6 mr-2" /> BSC Wallet
//           </button>

//           <button
//             className="w-full py-2 bg-gray-500 text-white hover:bg-black rounded-lg"
//             onClick={() => setShowWallets(false)}
//           >
//             Close
//           </button>
//         </>
//       )}
//     </div>
//   );
// };

// export default WalletConnect;


// import { useState } from "react";
// import { useSyncProviders } from "../hooks/useSyncProviders";
// import { formatAddress } from "../utilis/index";
// import { Dialog } from "@headlessui/react";

// interface EIP6963ProviderDetail {
//   provider: any;
//   info: {
//     uuid: string;
//     name: string;
//     icon: string;
//   };
// }

// export const DiscoverWalletProviders = () => {
//   const [selectedWallet, setSelectedWallet] = useState<EIP6963ProviderDetail | null>(null);
//   const [userAccount, setUserAccount] = useState<string>("");
//   const [isOpen, setIsOpen] = useState<boolean>(false);

//   const providers: EIP6963ProviderDetail[] = useSyncProviders();

//   const handleConnect = async (providerWithInfo: EIP6963ProviderDetail) => {
//     const accounts = await providerWithInfo.provider
//       .request({ method: "eth_requestAccounts" })
//       .catch(console.error);

//     if (accounts?.[0]) {
//       setSelectedWallet(providerWithInfo);
//       setUserAccount(accounts[0]);
//       setIsOpen(false); // Close modal after selection
//     }
//   };

//   return (
//     <div className="flex flex-col items-center p-4">
//       <button
//         onClick={() => setIsOpen(true)}
//         className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//       >
//         Connect Wallet
//       </button>

//       <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
//         <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
//           <Dialog.Panel className="bg-white p-6 rounded-xl shadow-lg w-80">
//             <Dialog.Title className="text-lg font-semibold">Select a Wallet</Dialog.Title>
//             <div className="mt-4 grid gap-2">
//               {providers.length > 0 ? (
//                 providers.map((provider) => (
//                   <button
//                     key={provider.info.uuid}
//                     onClick={() => handleConnect(provider)}
//                     className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-100 w-full"
//                   >
//                     <img src={provider.info.icon} alt={provider.info.name} className="w-6 h-6" />
//                     <span>{provider.info.name}</span>
//                   </button>
//                 ))
//               ) : (
//                 <div className="text-center text-gray-500">No Announced Wallet Providers</div>
//               )}
//             </div>
//           </Dialog.Panel>
//         </div>
//       </Dialog>

//       {userAccount && selectedWallet && (
//         <div className="mt-6 p-4 border rounded-lg shadow-md flex flex-col items-center">
//           <img src={selectedWallet.info.icon} alt={selectedWallet.info.name} className="w-10 h-10 mb-2" />
//           <div className="font-semibold">{selectedWallet.info.name}</div>
//           <div className="text-sm text-gray-600">({formatAddress(userAccount)})</div>
//         </div>
//       )}
//     </div>
//   );
// };
