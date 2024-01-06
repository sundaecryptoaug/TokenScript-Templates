// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./SmartCatTreats.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract SmartCatProxyV2 is Initializable, OwnableUpgradeable {

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

	uint256[] public levelAwards; // Level 0 is the amount for any action performed
	mapping(uint256 => uint256) public pointBalances;

	struct CatInfo {
		CatState state;
		uint256 pointsBalance;
		uint256 actionLimitReset;
		//string catName;
	}

	uint16 version;

	struct MaxActionState {
		uint256 firstActionTimestamp;
		uint16 count;
	}

	mapping(uint256 => MaxActionState) public maxActionState;

	uint16 private maxActions;
	uint256 private maxActionsInterval; // 1 day

	address[] public authorisedProxyAddresses;

	string constant CAT_NOT_EXIST = "Cat does not exist or is not adopted yet!";

	//address private pointsContractAddress;

	//mapping(uint256 => string) public catNames;
	//bool private allowCatTreatWithdraw = false;

	function hasNotReachedMaxActions(uint256 catId) internal view returns (bool) {
		if (maxActionState[catId].count < maxActions){
			return true;
		}
		// Exceeded wait time
		if (maxActionState[catId].firstActionTimestamp + maxActionsInterval < block.timestamp){
			return true;
		}

		return false;
	}

	function incrementMaxActionCount(uint256 catId) internal {
		if (maxActionState[catId].count != 0 && maxActionState[catId].count < maxActions){
			maxActionState[catId].count++;
			return;
		}
		maxActionState[catId].count = 1;
		maxActionState[catId].firstActionTimestamp = block.timestamp;
	}

	function initialize(address _nftContractAddress) public initializer {
        nftContractAddress = _nftContractAddress;
		minIntervals = [60, 60, 60]; // [21600, 21600, 21600]; // in seconds, 6 hours by default
		minLevelUpScores = [1,1,1]; //[7,5,3];
		maxLevel = 14;
		maxActions = 15;
		maxActionsInterval = 86400;
		__Ownable_init(msg.sender);
    }

	function upgradeV2() public {
		if (version >= 2)
			revert("Already upgraded");

		maxLevel = 14;
		minIntervals = [60, 60, 60];
		maxActions = 15;
		maxActionsInterval = 86400;
		levelAwards = [25, 0, 0, 0, 0, 0, 0, 500, 0, 0, 1200, 0, 0, 0, 2500];
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

	function setLevelAwards(uint256[] memory _levelAwards) public onlyOwner {
		levelAwards = _levelAwards;
	}

	function setMaxActionConfig(uint16 _maxActions, uint256 _maxActionsInterval) public onlyOwner {
		maxActions = _maxActions;
		maxActionsInterval = _maxActionsInterval;
	}

	function setAuthedProxyAddresses(address[] memory _authorisedProxyAddresses) public onlyOwner {
		authorisedProxyAddresses = _authorisedProxyAddresses;
	}

	function setNftContractAddress(address _nftContractAddress) public onlyOwner {
		nftContractAddress = _nftContractAddress;
	}

	/*function setPointsContract(address _pointsContractAddress) public onlyOwner {
		pointsContractAddress = _pointsContractAddress;
	}

	function setAllowCatTreatWithdraw(bool _allowCatTreatWithdraw) public onlyOwner {
		allowCatTreatWithdraw = _allowCatTreatWithdraw;
	}*/

	// USER FUNCTIONS
	modifier mustOwnTokenOrBeAuthorised(uint256 tokenId) {
		IERC721 nftContract = IERC721(nftContractAddress);
		require(findAddress(authorisedProxyAddresses, msg.sender) || nftContract.ownerOf(tokenId) == msg.sender, "You don't own this kitty :-P");
		_;
	}

	/*modifier canNameCat() {
		require(findAddress(authorisedProxyAddresses, msg.sender), "Not authorised");
		_;
	}

	function setCatNameAllowedAddresses(uint256 tokenId, string memory name) public canNameCat {
		catNames[tokenId] = name;
	}*/

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
			!hasNotReachedMaxActions(tokenId) ||
			catStates[tokenId].numFeeds < (minLevelUpScores[0] * catStates[tokenId].level) ||
			catStates[tokenId].numPlays < (minLevelUpScores[1] * catStates[tokenId].level) ||
			catStates[tokenId].numCleans < (minLevelUpScores[2] * catStates[tokenId].level)
		);
	}

	function levelUp(uint256 tokenId) public mustOwnTokenOrBeAuthorised(tokenId) {

		if(!canLevelUp(tokenId))
			revert("Goal not reached!");

		catStates[tokenId].level++;
		pointBalances[tokenId] += levelAwards[catStates[tokenId].level];
		incrementMaxActionCount(tokenId);
	}

	function canFeed(uint256 tokenId) public view returns (bool) {
		return hasNotReachedMaxActions(tokenId) &&
				block.timestamp > (catStates[tokenId].lastFeed + minIntervals[0]);
	}

	function feedCat(uint256 tokenId) public mustOwnTokenOrBeAuthorised(tokenId) {
		if (!canFeed(tokenId))
			revert("Cat is too fat :-P");

		initializeCat(tokenId);
		catStates[tokenId].numFeeds++;
		catStates[tokenId].lastFeed = block.timestamp;
		pointBalances[tokenId] += levelAwards[0];
		incrementMaxActionCount(tokenId);
	}

	// Disabled for now
	/*function feedOtherCat(uint256 tokenId) public {

		if (catStates[tokenId].level == 0)
			revert("Cat hasn't been adopted yet!");

		if (!canFeed(tokenId))
			revert("You can't feed your cat too much, it will get fat :-P");

		catStates[tokenId].numFeeds++;
		catStates[tokenId].lastFeed = block.timestamp;
		catTreatBalances[tokenId] += levelAwards[0];
		incrementMaxActionCount(tokenId);
	}*/

	function canPlay(uint256 tokenId) public view returns (bool) {
		return catStates[tokenId].level > 0 &&
				hasNotReachedMaxActions(tokenId) &&
				block.timestamp > (catStates[tokenId].lastPlay + minIntervals[1]);
	}

	// Disabled for now
	/*function playWithCat(uint256 tokenId) public mustOwnToken(tokenId) {
		if (!canPlay(tokenId))
			revert("Your cat is our of energy, he needs time to rest.");

		// already initialized
		// initialize(tokenId);
		catStates[tokenId].numPlays++;
		catStates[tokenId].lastPlay = block.timestamp;
		catTreatBalances[tokenId] += levelAwards[0];
		incrementMaxActionCount(tokenId);
	}*/

	function canClean(uint256 tokenId) public view returns (bool) {
		return catStates[tokenId].level > 0 &&
				hasNotReachedMaxActions(tokenId) &&
				block.timestamp > (catStates[tokenId].lastClean + minIntervals[2]);
	}

	function cleanCat(uint256 tokenId) public mustOwnTokenOrBeAuthorised(tokenId) {
		if (!canClean(tokenId))
			revert("You will be scratched!");
		// already initialized
		// initializeCat(tokenId);
		catStates[tokenId].numCleans++;
		catStates[tokenId].lastClean = block.timestamp;
		pointBalances[tokenId] += levelAwards[0];
		incrementMaxActionCount(tokenId);
	}

	function getLevel(uint256 tokenId) public view returns (uint8) {
		return catStates[tokenId].level;
	}

	function getPointsBalance(uint256 tokenId) public view returns (uint256) {
		return pointBalances[tokenId];
	}

    function getCatState(uint256 tokenId) public view returns (CatState memory) {
		return catStates[tokenId];
	}

	function getCatInfo(uint256 tokenId) public view returns (CatInfo memory) {
		return CatInfo(catStates[tokenId], pointBalances[tokenId], hasNotReachedMaxActions(tokenId) ? 0 : maxActionState[tokenId].firstActionTimestamp + maxActionsInterval);
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

	function inviteCatForPlaying(uint256 tokenId, uint256 invitee) public mustOwnTokenOrBeAuthorised(tokenId) {

		// cat can exist, but not adopted
		if (catStates[invitee].level < 1)
			revert(CAT_NOT_EXIST);

		if (tokenId == invitee)
			revert(unicode"Cat cannot play with themself ಠ_ಠ");

		// Cannot play with cats in the same wallet!
		IERC721 nftContract = IERC721(nftContractAddress);

		if (nftContract.ownerOf(invitee) == msg.sender)
			revert("Your cats brothers and sisters don't get along :-/");

		for (uint i=0; i<playInvites[invitee].length; i++){
			if (playInvites[invitee][i] == tokenId)
				revert("Already invited this cat to play!");
		}

		initializeCat(tokenId);
		playInvites[invitee].push(tokenId);
	}

	function acceptPlayDate(uint256 tokenId, uint256 inviter) public mustOwnTokenOrBeAuthorised(tokenId) {

		if (playInvites[tokenId].length == 0)
			revert("You have no invites");

		if (inviter == 0)
			revert("Select an invite");

		for (uint i=0; i<playInvites[tokenId].length; i++){

			if (playInvites[tokenId][i] == inviter){
				if (playInvites[tokenId].length > 1){
					playInvites[tokenId][i] = playInvites[tokenId][playInvites[tokenId].length-1];
				}
				playInvites[tokenId].pop();

				// Can accept unlimited playInvites, but only one per minIntervals counts towards number of plays
				if (canPlay(tokenId)){
					catStates[tokenId].numPlays++;
					catStates[tokenId].lastPlay = block.timestamp;
					pointBalances[tokenId] += levelAwards[0];
					incrementMaxActionCount(tokenId);
				}

				if (canPlay(inviter)){
					catStates[inviter].numPlays++;
					catStates[inviter].lastPlay = block.timestamp;
					pointBalances[inviter] += levelAwards[0];
					incrementMaxActionCount(inviter);
				}

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

	function findAddress(address[] memory arr, address searchFor) private pure returns (bool) {
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

	/*function withdrawPoints(uint256 tokenId, uint256 amount) public mustOwnTokenOrBeAuthorised(tokenId) {

		require(allowCatTreatWithdraw, "Currently disabled");

		if (catStates[tokenId].level < 1)
			revert(CAT_NOT_EXIST);

		if (catTreatBalances[tokenId] < amount)
			revert("Insufficient balance");

		ISmartCatTreats pointsContract = ISmartCatTreats(pointsContractAddress);

		catTreatBalances[tokenId] -= amount;
		pointsContract.mintFromSmartCat(msg.sender, amount);
	}

	function depositPoints(uint256 tokenId, uint256 amount) public {

		require(allowCatTreatWithdraw, "Currently disabled");

		if (catStates[tokenId].level < 1)
			revert(CAT_NOT_EXIST);

		ISmartCatTreats pointsContract = ISmartCatTreats(pointsContractAddress);

		if (pointsContract.balanceOf(msg.sender) < amount)
			revert("Insufficient balance");

		pointsContract.burnFromSmartCat(msg.sender, amount);
		catTreatBalances[tokenId] += amount;
	}*/
}
