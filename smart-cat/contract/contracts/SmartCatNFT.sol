// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "stl-contracts/ERC/ERC5169.sol";

contract SmartCatNFT is ERC721URIStorage, Ownable, ERC5169 {

	string private BASE_URI;

	constructor() ERC721("SmartCat", "SC") Ownable(msg.sender) {
		BASE_URI = "https://viewer-staging.tokenscript.org/assets/tokenscripts/smart-cat/";
	}

	function _baseURI() internal view override returns (string memory) {
		return BASE_URI;
	}

	function setBaseUri(string memory uri)
	public
	onlyOwner
	{
		BASE_URI = uri;
	}

	function safeMint(address to, uint256 tokenId, string memory uri)
	public
	onlyOwner
	{
		_safeMint(to, tokenId);
		_setTokenURI(tokenId, uri);
	}

	function contractURI() public view returns (string memory) {
		return string(abi.encodePacked(_baseURI(), "contract.json"));
	}

	function tokenURI(uint256 tokenId)
	public
	view
	override(ERC721URIStorage)
	returns (string memory)
	{
		return super.tokenURI(tokenId);
	}

	function supportsInterface(bytes4 interfaceId)
	public
	view
	override(ERC5169, ERC721URIStorage)
	returns (bool)
	{
		return
			ERC721.supportsInterface(interfaceId) ||
			ERC721URIStorage.supportsInterface(interfaceId) ||
			ERC5169.supportsInterface(interfaceId);
	}

	function _authorizeSetScripts(string[] memory) internal view override(ERC5169) {
		require(msg.sender == owner(), "You do not have the authority to set the script URI");
	}
}
