# Beamit AI - 3D Avatar Generator

## Overview

Beamit AI is an advanced Web3 application that transforms 2D NFT profile pictures (PFPs) into fully rigged 3D avatars that can be minted as new NFTs on the Scroll blockchain testnet. The platform allows users to connect their crypto wallet, select an existing NFT from their collection, generate a full-body image, and then convert it into a 3D model that can be viewed, interacted with, and minted.

This application demonstrates the intersection of NFT technology, 3D modeling, and blockchain integration, providing a seamless experience for users looking to extend their digital assets into metaverse-ready 3D representations.

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js with Express
- **Blockchain**: Ethereum (Scroll Testnet)
- **3D Rendering**: model-viewer web component
- **Wallet Integration**: Web3/Ethereum providers (MetaMask)
- **NFT Data**: OpenSea API
- **File Storage**: IPFS for decentralized storage

## Architecture

The application follows a client-server architecture:

1. **Frontend**: React application that handles user interface, wallet connection, and NFT selection
2. **Backend**: Node.js server that processes images, generates 3D models, and handles communication with blockchain
3. **WebSocket**: Real-time communication between frontend and backend for processing updates
4. **Smart Contract**: ERC-721 standard for minting new 3D NFTs on the Scroll testnet

## Key Features

- Wallet connection and NFT retrieval from user collections
- Image processing to generate full-body representations from PFPs
- 3D model generation with proper rigging using AI
- Real-time progress updates via WebSocket
- Interactive 3D model viewer with AR capabilities
- Direct minting to the Scroll testnet
- Responsive design for various device sizes

## Prerequisites

Before setting up the project, ensure you have:

- Node.js (v16+) and npm installed
- MetaMask extension installed in your browser
- Access to the Scroll testnet (for minting functionality)
- API keys for OpenSea and Alchemy
- Git for version control

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/beamit-ai.git
cd beamit-ai
```

### 2. Environment Setup

Create `.env` files in both frontend and backend directories:

**Backend (.env)**:
```
PORT=5001
OPENSEA_API_KEY=your_opensea_api_key
ALCHEMY_API_KEY=your_alchemy_api_key
```

**Frontend (.env)**:
```
REACT_APP_OPENSEA_API_KEY=your_opensea_api_key
REACT_APP_API_URL=http://localhost:5001
REACT_APP_ALCHEMY_API_KEY=your_alchemy_api_key
```

### 3. Install Dependencies

Install backend dependencies:
```bash
cd backend
npm install
```

Install frontend dependencies:
```bash
cd frontend
npm install
```

### 4. Directory Setup

Ensure these directories exist in the backend folder:
```bash
mkdir -p backend/pfp
mkdir -p backend/fullbodyimages
mkdir -p backend/3dmesh
mkdir -p backend/logs
```

### 5. Starting the Application

Start the backend server:
```bash
cd backend
npm start
```

Start the frontend development server:
```bash
cd frontend
npm start
```

The application should now be running at `http://localhost:3000`.

## Project Structure

```
beamit-ai/
├── backend/
│   ├── server.js           # Main server file
│   ├── routes/             # API route handlers
│   ├── controllers/        # Business logic
│   ├── models/             # Data models
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   ├── pfp/                # Storage for profile pictures
│   ├── fullbodyimages/     # Storage for generated full-body images
│   └── 3dmesh/             # Storage for 3D model files
├── frontend/
│   ├── public/             # Static files
│   └── src/
│       ├── components/     # React components
│       ├── contracts/      # Smart contract ABIs
│       ├── utils/          # Utility functions
│       ├── images/         # Image assets
│       ├── App.js          # Main application component
│       └── index.js        # Entry point
└── README.md               # Project documentation
```

## Usage Flow

1. **Connect Wallet**: Users connect their MetaMask wallet to the application.
2. **NFT Selection**: The app fetches and displays NFTs from the user's wallet, allowing them to select one.
3. **Full Body Generation**: When a user clicks "Create Full Body Image," the selected NFT image is sent to the backend, processed, and a full-body representation is generated.
4. **3D Conversion**: Upon clicking "Beam It!," the full-body image is transformed into a 3D model.
5. **Interactive Viewing**: Once processed, users can interact with their 3D avatar, rotating and examining it from all angles.
6. **Minting**: Finally, users can mint their 3D avatar as a new NFT on the Scroll testnet.

## Smart Contract Interaction

The application interacts with an ERC-721 contract deployed on the Scroll testnet. The minting process includes:

1. Uploading model data to IPFS
2. Creating metadata that references the IPFS location
3. Calling the `mint` function on the smart contract
4. Handling transaction confirmation and receipt

Contract address and ABI are stored in `frontend/src/contracts/BeamitAIGen1.js`.

## Customization Guide

### Styling

The application uses a combination of CSS and inline styles. Main styling can be found in:
- `frontend/src/App.css` for global styles
- Inline styles within component files for component-specific styling

Colors use a consistent palette:
- Primary pink: `#ff00ff`
- Accent cyan: `#00ffff`
- Background: Black
- Text: White or colored based on context

### Adding New Features

When adding new features, follow these guidelines:
1. Create component files in the appropriate directory
2. Maintain the existing state management pattern
3. Use the WebSocket for real-time updates
4. Document any new API endpoints

## Common Issues and Troubleshooting

- **WebSocket Connection Errors**: Ensure the backend server is running and the WebSocket URL is correct
- **NFT Loading Issues**: Check OpenSea API key and network connectivity
- **3D Model Not Displaying**: Verify the model path and that the model-viewer component is properly loaded
- **Minting Failures**: Ensure the user has the correct network selected in MetaMask and sufficient funds

## Contributing

We welcome contributions to enhance Beamit AI. Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



## Acknowledgments

- OpenSea API for NFT data retrieval
- model-viewer web component for 3D rendering
- Scroll blockchain for testnet support
- MetaMask for wallet integration

## Contact

For questions or support, please reach out to the development team at [support@beamitai.com](mailto:support@beamitai.com) or open an issue in the GitHub repository.
