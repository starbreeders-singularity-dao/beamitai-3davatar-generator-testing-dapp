// import { useState } from "react";
// import { useSyncProviders } from "../hooks/useSyncProviders";
// import { formatAddress } from "../utilis/index";
// import { Dialog, Transition } from "@headlessui/react";
// import { Fragment } from "react";

// interface EIP6963ProviderDetail {
//   provider: any;
//   info: {
//     uuid: string;
//     name: string;
//     icon: string;
//   };
// }
// interface DiscoverWalletProvidersProps {
//     onClose: () => void; // Receive the onClose function from Header
//   }
// export const DiscoverWalletProviders : React.FC<DiscoverWalletProvidersProps> = ({ onClose })  => {
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
//       onClose();
//     }
//   };

//   return (
//     <div className="flex flex-col items-center p-4">
//       <button
//         onClick={() => setIsOpen(true)}
//         className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md shadow-md hover:bg-blue-700 transition"
//       >
//         Connect Wallet
//       </button>

//       {/* MODAL */}
//       <Transition appear show={isOpen} as={Fragment}>
//         <Dialog  className="relative z-50" onClose={() => setIsOpen(false)}>
//           <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
//             <Dialog.Panel className="bg-white p-5 rounded-lg shadow-lg w-72 max-w-sm transform transition-all">
//               <Dialog.Title className="text-lg font-semibold text-center">Select a Wallet</Dialog.Title>

//               <div className="mt-4 space-y-2">
//                 {providers.length > 0 ? (
//                   providers.map((provider) => (
//                     <button
//                       key={provider.info.uuid}
//                       onClick={() => handleConnect(provider)}
//                       className="flex items-center space-x-3 p-2 border rounded-md hover:bg-gray-100 w-full transition"
//                     >
//                       <img src={provider.info.icon} alt={provider.info.name} className="w-6 h-6" />
//                       <span className="text-sm">{provider.info.name}</span>
//                     </button>
//                   ))
//                 ) : (
//                   <div className="text-center text-gray-500">No Announced Wallet Providers</div>
//                 )}
//               </div>

//               {/* CLOSE BUTTON */}
//               <div className="mt-4 flex justify-center">
//                 <button
//                   onClick={() => setIsOpen(false)}
//                   className="px-3 py-1 text-sm text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition"
//                 >
//                   Close
//                 </button>
//               </div>
//             </Dialog.Panel>
//           </div>
//         </Dialog>
//       </Transition>

//       {/* WALLET INFO CARD */}
//       {userAccount && selectedWallet && (
//         <div className="mt-6 p-4 border rounded-lg shadow-md flex flex-col items-center bg-gray-50">
//           <img src={selectedWallet.info.icon} alt={selectedWallet.info.name} className="w-10 h-10 mb-2" />
//           <div className="font-semibold">{selectedWallet.info.name}</div>
//           <div className="text-sm text-gray-600">({formatAddress(userAccount)})</div>
//         </div>
//       )}
//     </div>
//   );
// };
import {  Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useSyncProviders } from "../hooks/useSyncProviders";
import { useWallet } from "../context/WalletContext"; 

interface DiscoverWalletProvidersProps {
  onClose: () => void;
}

export const DiscoverWalletProviders: React.FC<DiscoverWalletProvidersProps> = ({ onClose }) => {
  const {  setWalletAddress } = useWallet(); 
  //const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const providers = useSyncProviders();

  const handleConnect = async (provider: any) => {
    try {
      const accounts = await provider.provider.request({ method: "eth_requestAccounts" });
      if (accounts.length > 0) {
        //setSelectedWallet(accounts[0]);
        setWalletAddress(accounts[0]); 
        onClose(); // Close modal after connecting
      }
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  };

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Dialog.Panel className="bg-black p-6 rounded-lg shadow-lg w-80">
            <Dialog.Title className="text-lg font-semibold text-center">Select a Wallet</Dialog.Title>

            <div className="mt-4 space-y-2">
              {providers.length > 0 ? (
                providers.map((provider) => (
                  <button
                    key={provider.info.uuid}
                    onClick={() => handleConnect(provider)}
                    className="flex items-center space-x-3 p-2 border rounded-md hover:bg-pink-500 w-full transition"
                  >
                    <img src={provider.info.icon} alt={provider.info.name} className="w-6 h-6" />
                    <span className="text-sm">{provider.info.name}</span>
                  </button>
                ))
              ) : (
                <p className="text-center text-gray-500">No Wallet Providers Found</p>
              )}
            </div>

            {/* Close Button */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-white bg-pink-500 rounded-md hover:bg-pink-600 transition"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};
