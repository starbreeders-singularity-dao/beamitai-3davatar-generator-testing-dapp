// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract 3DNFT is ERC721Enumerable, Ownable {
    using Strings for uint256;

    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);

    constructor() ERC721("YourNFT", "YNFT") {}

    function safeMint(address to, uint256 tokenId) public onlyOwner {
        require(balanceOf(msg.sender)>0.008,"You need tokens to mint!";
        uint256 currentBalance = balanceOf(msg.sender);
        _safeMint(to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) public override {
        _setApprovalForAll(operator, approved);
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
        return _isApprovedOrOwner(owner, operator);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721URIStorage: URI query for nonexistent token");

        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? baseURI + tokenId.toString() : "";
    }
}
