// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract 3DNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Enum to represent supported blockchains
    enum Blockchain { Scroll, Binance, Solana, Polygon, Celestia }

    // Struct to store NFT metadata
    struct NFTMetadata {
        string aiModel;        // AI model used (e.g., Stable Diffusion)
        string prompt;         // User-provided prompt
        uint256 timestamp;     // Minting timestamp
        Blockchain blockchain; // Blockchain where NFT is minted
        bool isMinted;         // Mint status
    }

    // Minting parameters
    uint256 public mintPrice = 0.01 ether; // Cost to mint an NFT
    uint256 public maxSupply = 10000;      // Total supply cap
    uint256 public maxPerWallet = 10;      // Max NFTs per wallet

    // Mappings to track NFT details and wallet mints
    mapping(uint256 => NFTMetadata) public nftDetails;
    mapping(address => uint256) public walletMints;

    // Events for logging
    event NFTMinted(uint256 indexed tokenId, address indexed recipient, string tokenURI, Blockchain blockchain);
    event AIMetadataAdded(uint256 indexed tokenId, string aiModel, string prompt);

    // Constructor initializes the ERC721 token with name "3DNFT" and symbol "3DN"
    constructor() ERC721("AIGenNFT", "3DN") Ownable(msg.sender) {}

    // Mint a single NFT
    function mintAIGenNFT(
        string memory tokenURI,
        string memory aiModel,
        string memory prompt,
        Blockchain blockchain
    ) public payable nonReentrant returns (uint256) {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(_tokenIds.current() < maxSupply, "Max supply reached");
        require(walletMints[msg.sender] < maxPerWallet, "Wallet limit reached");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        // Store metadata with Scroll as default if not specified
        nftDetails[newTokenId] = NFTMetadata({
            aiModel: aiModel,
            prompt: prompt,
            timestamp: block.timestamp,
            blockchain: blockchain,
            isMinted: true
        });

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        walletMints[msg.sender]++;

        emit NFTMinted(newTokenId, msg.sender, tokenURI, blockchain);
        emit AIMetadataAdded(newTokenId, aiModel, prompt);

        return newTokenId;
    }

    // Get NFT metadata
    function getNFTDetails(uint256 tokenId) public view returns (NFTMetadata memory) {
        require(_exists(tokenId), "NFT does not exist");
        return nftDetails[tokenId];
    }

    // Owner can update mint price
    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }

    // Withdraw contract balance (for owner)
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }

    // Override tokenURI function
    function tokenURI(uint256 tokenId) public view override(ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}
