// export const updateMessage = async (address, message) => {

//     //input error handling
//     if (!window.ethereum || address === null) {
//       return {
//         status:
//           "💡 Connect your Metamask wallet to update the message on the blockchain.",
//       };
//     }
  
//     if (message.trim() === "") {
//       return {
//         status: "❌ Your message cannot be an empty string.",
//       };
//     }
  
//     //set up transaction parameters
//     const transactionParameters = {
//       to: contractAddress, // Required except during contract publications.
//       from: address, // must match user's active address.
//       data: helloWorldContract.methods.update(message).encodeABI(),
//     };
  
//     //sign the transaction
//     try {
//       const txHash = await window.ethereum.request({
//         method: "eth_sendTransaction",
//         params: [transactionParameters],
//       });
//       return {
//         status: (
  
//             ✅{" "}
  
//               View the status of your transaction on Etherscan!
  
  
//             ℹ️ Once the transaction is verified by the network, the message will
//             be updated automatically.
  
//         ),
//       };
//     } catch (error) {
//       return {
//         status: "😥 " + error.message,
//       };
//     }
//   };