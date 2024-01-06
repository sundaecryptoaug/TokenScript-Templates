// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract SmartCatProxy is Initializable, OwnableUpgradeable {

	address private nftContractAddress;

	// Order: feed, play, clean
	uint256[3] private minIntervals;
	uint16[3] private minLevelUpScores;

	uint8 public maxLevel;

	struct CatState {
		uint8 level;
		uint16 numFeeds;
		uint256 lastFeed;
		uint16 numPlays;
		uint256 lastPlay;
		uint16 numCleans;
		uint256 lastClean;
		uint256[] friends; // Cats that have successfully played together
	}

	struct CatListItem {
		uint256 tokenId;
		string tokenUri;
		address owner;
		uint8 level;
		bool canPlay;
	}

	struct AllCatListItem {
		uint256 tokenId;
		address owner;
		uint8 level;
	}

	mapping(uint256 => CatState) public catStates;

	// Invitee -> array of inviters
	mapping(uint256 => uint256[]) public playInvites;

	uint256[] public catIds;

	function initialize(address _nftContractAddress) public initializer {
        nftContractAddress = _nftContractAddress;
		minIntervals = [30,30,30]; // [21600, 21600, 21600]; // in seconds, 6 hours by default
		minLevelUpScores = [1,1,1]; //[7,5,3];
		maxLevel = 7;
		__Ownable_init(msg.sender);
    }

	function getConfig() public view returns (uint256[3] memory, uint16[3] memory, uint8){
		return (minIntervals, minLevelUpScores, maxLevel);
	}

	// ADMIN FUNCTIONS
	function setMinIntervals(uint256[3] memory _minIntervals) public onlyOwner {
		minIntervals = _minIntervals;
	}

	function setMinLevelUpScores(uint16[3] memory _minLevelUpScores) public onlyOwner {
		minLevelUpScores = _minLevelUpScores;
	}

	function setMaxLevel(uint8 _maxLevel) public onlyOwner {
		maxLevel = _maxLevel;
	}

	// USER FUNCTIONS
	modifier mustOwnToken(uint256 tokenId) {
		IERC721 nftContract = IERC721(nftContractAddress);
		require(nftContract.ownerOf(tokenId) == msg.sender, "You don't own this kitty :-P");
		_;
	}

	function initializeCat(uint256 tokenId) private {
		if (catStates[tokenId].level == 0){
			catStates[tokenId].level = 1;
			catIds.push(tokenId);
		}
	}

	function canLevelUp(uint256 tokenId) public view returns (bool) {
		return !(
			catStates[tokenId].level == maxLevel ||
			catStates[tokenId].level < 1 ||
			catStates[tokenId].numFeeds < (minLevelUpScores[0] * catStates[tokenId].level) ||
			catStates[tokenId].numPlays < (minLevelUpScores[1] * catStates[tokenId].level) ||
			catStates[tokenId].numCleans < (minLevelUpScores[2] * catStates[tokenId].level)
		);
	}

	function levelUp(uint256 tokenId) public mustOwnToken(tokenId) {

		if(!canLevelUp(tokenId))
			revert("You haven't reached the goals to level up!");

		catStates[tokenId].level++;
	}

	function canFeed(uint256 tokenId) public view returns (bool) {
		return block.timestamp > (catStates[tokenId].lastFeed + minIntervals[0]);
	}

	function feedCat(uint256 tokenId) public mustOwnToken(tokenId) {
		if (!canFeed(tokenId))
			revert("You can't feed your cat too much, it will get fat :-P");

		initializeCat(tokenId);
		catStates[tokenId].numFeeds++;
		catStates[tokenId].lastFeed = block.timestamp;
	}

	function feedOtherCat(uint256 tokenId) public {

		if (catStates[tokenId].level == 0)
			revert("Cat hasn't been adopted yet!");

		if (!canFeed(tokenId))
			revert("You can't feed your cat too much, it will get fat :-P");

		catStates[tokenId].numFeeds++;
		catStates[tokenId].lastFeed = block.timestamp;
	}

	function canPlay(uint256 tokenId) public view returns (bool) {
		return catStates[tokenId].level > 0 && block.timestamp > (catStates[tokenId].lastPlay + minIntervals[1]);
	}

	function playWithCat(uint256 tokenId) public mustOwnToken(tokenId) {
		if (!canPlay(tokenId))
			revert("Your cat is our of energy, he needs time to rest.");

		// already initialized
		// initialize(tokenId);
		catStates[tokenId].numPlays++;
		catStates[tokenId].lastPlay = block.timestamp;
	}

	function canClean(uint256 tokenId) public view returns (bool) {
		return catStates[tokenId].level > 0 && block.timestamp > (catStates[tokenId].lastClean + minIntervals[2]);
	}

	// cant clean with un-init cat

	function cleanCat(uint256 tokenId) public mustOwnToken(tokenId) {
		if (!canClean(tokenId))
			revert("Your cat hates baths, if you bath him too much, you will be scratched");
		// already initialized
		// initializeCat(tokenId);
		catStates[tokenId].numCleans++;
		catStates[tokenId].lastClean = block.timestamp;
	}

	function getLevel(uint256 tokenId) public view returns (uint8) {
		return catStates[tokenId].level;
	}

	// These functions aren't needed at the moment, since we use getCatState & getConfig within the tokescript view
	/*function getNumFeeds(uint256 tokenId) public view returns (uint16) {
		return catStates[tokenId].numFeeds;
	}

	function getNextFeedTime(uint256 tokenId) public view returns (uint256) {
		return catStates[tokenId].lastFeed + minIntervals[0];
	}

	function getNumPlays(uint256 tokenId) public view returns (uint16) {
		return catStates[tokenId].numPlays;
	}

	function getNextPlayTime(uint256 tokenId) public view returns (uint256) {
		return catStates[tokenId].lastPlay + minIntervals[1];
	}

	function getNumCleans(uint256 tokenId) public view returns (uint16) {
		return catStates[tokenId].numCleans;
	}

	function getNextCleanTime(uint256 tokenId) public view returns (uint256) {
		return catStates[tokenId].lastClean + minIntervals[2];
	}*/

    function getCatState(uint256 tokenId) public view returns (CatState memory) {
		return catStates[tokenId];
	}

	function getPlayInviteIds(uint256 tokenId) public view returns (uint256[] memory){
		return playInvites[tokenId];
	}

	function getFriendsList(uint256 tokenId) public view returns (CatListItem[] memory){
		return tokenIdArrayToTokenList(catStates[tokenId].friends);
	}

	function getPlayInvitesList(uint256 tokenId) public view returns (CatListItem[] memory){
		return tokenIdArrayToTokenList(playInvites[tokenId]);
	}

	function tokenIdArrayToTokenList(uint256[] memory tokenIds) public view returns (CatListItem[] memory){
		ERC721URIStorage nftContract = ERC721URIStorage(nftContractAddress);
		CatListItem[] memory list = new CatListItem[](tokenIds.length);
		for (uint i=0; i<tokenIds.length; i++){
			uint256 tokenId = tokenIds[i];
			list[i] = CatListItem(
				tokenId,
				nftContract.tokenURI(tokenId),
				nftContract.ownerOf(tokenId),
				catStates[tokenId].level,
				canPlay(tokenId)
			);
		}
		return list;
	}

	function inviteCatForPlaying(uint256 tokenId, uint256 invitee) public mustOwnToken(tokenId) {

		// cat can exist, but not adopted
		if (catStates[invitee].level < 1)
			revert("The requested cat does not exist!");

		if (tokenId == invitee)
			revert(unicode"Your cat cannot play with themself ಠ_ಠ");

		for (uint i=0; i<playInvites[invitee].length; i++){
			if (playInvites[invitee][i] == tokenId)
				revert("You have already invited this cat to play!");
		}

		initializeCat(tokenId);
		playInvites[invitee].push(tokenId);
	}

	function acceptPlayDate(uint256 tokenId, uint256 inviter) public mustOwnToken(tokenId) {

		if (playInvites[tokenId].length == 0)
			revert("You have no invites");

		if (inviter == 0)
			revert("Select an invite");

		if (!canPlay(tokenId))
			revert("Your cat is too tired to play :-(");

		if (!canPlay(inviter))
			revert("The other cat is too tired to play :-(");

		for (uint i=0; i<playInvites[tokenId].length; i++){

			if (playInvites[tokenId][i] == inviter){
				if (playInvites[tokenId].length > 1){
					playInvites[tokenId][i] = playInvites[tokenId][playInvites[tokenId].length-1];
				}
				playInvites[tokenId].pop();

				catStates[tokenId].numPlays++;
				catStates[tokenId].lastPlay = block.timestamp;
				catStates[inviter].numPlays++;
				catStates[inviter].lastPlay = block.timestamp;

				if (!find(catStates[tokenId].friends, inviter)){
					catStates[tokenId].friends.push(inviter);
					catStates[inviter].friends.push(tokenId);
				}
				return;
			}
		}

		revert("Inviter not found");
	}

	function find(uint256[] memory arr, uint256 searchFor) private pure returns (bool) {
		for (uint256 i = 0; i < arr.length; i++) {
			if (arr[i] == searchFor)
				return true;
		}
		return false;
	}

	function getAllCats() public view returns (AllCatListItem[] memory){

		IERC721 nftContract = IERC721(nftContractAddress);

		AllCatListItem[] memory catList = new AllCatListItem[](catIds.length);

		for (uint x=0; x<catIds.length; x++){

			uint tokenId = catIds[x];

			catList[x] = AllCatListItem(
				tokenId,
				nftContract.ownerOf(tokenId),
				catStates[tokenId].level
			);
		}

		return catList;
	}
}
