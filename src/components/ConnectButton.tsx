// import { ConnectButton } from "@rainbow-me/rainbowkit";

// const Navbar = () => {
//   return (
//     <nav className="p-4 bg-gray-800 text-white flex justify-between">
//       <h1 className="text-xl font-bold">NFT Dapp</h1>
//       <ConnectButton />
//     </nav>
//   );
// };

// export default Navbar;

// import { useAccount, useConnect, useDisconnect } from "wagmi"

// export const ConnectButton = () => {
//   const { address } = useAccount()
//   const { connectors, connect } = useConnect()
//   const { disconnect } = useDisconnect()

//   return (
//     <div>
//       {address ? (
//         <button onClick={() => disconnect()}>Disconnect</button>
//       ) : (
//         connectors.map((connector) => (
//           <button key={connector.uid} onClick={() => connect({ connector })}>
//             {connector.name}
//           </button>
//         ))
//       )}
//     </div>
//   )
// }

// import { useAccount, useConnect, useDisconnect } from "wagmi";
// //import { metaMask } from "wagmi/connectors";
// import Button from "./Button"; // Import the styled button

// export const ConnectButton = () => {
//   const { address } = useAccount();
//   const { connect, connectors } = useConnect();
//   const { disconnect } = useDisconnect();

//   const metaMaskConnector = connectors.find((c) => c.id === "metaMask");

//   return (
//     <div>
//       {address ? (
//         // Disconnect button
//         <Button className="bg-red-500 px-4 py-2" onClick={() => disconnect()}>
//           Disconnect
//         </Button>
//       ) : (
//         // Connect buttons for available wallets
//         // connectors.map((connector) => (
//         //   <Button
//         //     key={connector.uid}
//         //     className="bg-blue-500 px-4 py-2"
//         //     onClick={() => connect({ connector })}
//         //   >
//         //     Connect with {connector.name}
//         //   </Button>
//         // ))
//         <Button className="bg-blue-500 px-4 py-2" onClick={() => connect({ connector: metaMaskConnector })}>
//           Connect Wallet
//         </Button>
//       )}
//     </div>
//   );
// };
