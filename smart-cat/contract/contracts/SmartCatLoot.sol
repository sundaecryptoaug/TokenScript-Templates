// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// import '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import 'stl-contracts/ERC/ERC5169.sol';
import 'stl-contracts/royalty/DerivedERC2981Royalty.sol';
import 'stl-contracts/tokens/ERC721OptimizedEnumerableUpgradeable.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import 'hardhat/console.sol';

interface ISmartCatScore {
	function getLevel(uint256 tokenID) external view returns (uint8);
}

interface ISmartCatLootPool {
	function calculatePoolA() external view returns (uint256);

	function takePoolA(
		address recipient,
		uint256 poolAContribution,
		uint256 supply
	) external;

	function getPoolAMatic() external view returns (uint256);
}

contract SmartCatLoot is
	Initializable,
	ERC721OptimizedEnumerableUpgradeable,
	ERC721BurnableUpgradeable,
	OwnableUpgradeable,
	ERC5169,
	DerivedERC2981Royalty
{
	using Strings for uint256;

	using EnumerableSet for EnumerableSet.UintSet;

	uint256 public constant PROTOCOL_FEE_FACTOR = 10 * 1000;
	uint256 public constant POOL_A_FACTOR = 50 * 1000;
	uint256 public constant POOL_B_FACTOR = 10 * 1000;
	uint256 public constant STL_FEE_FACTOR = 40 * 1000;
	uint256 public constant WITHDRAW_DEPOSIT_FACTOR = 95 * 1000;
	uint256 public constant FEE_FACTOR = 50 * 1000;
	uint256 public constant POINTS_PER_PLAY = 75;
	string public constant STAGE1_PREFIX = 'Stage 1 allowed for ';

	// uint256 private _nextTokenId;
	uint256 private _purchasePrice;
	uint256 public mintStartTime;

	uint256 private _maxTokens;
	uint256 constant _FEE_DECIMALS = 100 * 1000;

	// TODO we have to decide what to use - array or Set
	// Set is better when lot of cats play with single toy
	// array is good when in most case 1-3 cats play with toys
	// mapping(uint256 => EnumerableSet.UintSet) _playSet;
	address public _smartCatLootPool;
	address public _smartCatMintFeePool;

	mapping(uint256 => uint256[]) _playMatrix; // toy to catIds - catIds that have played with the toy
	mapping(uint256 => uint256) public pointBalances;
	mapping(address => bool) public _walletHasMinted; // restrict mint to one per wallet
	mapping(uint256 => bool) public _catHasMinted; // restrict mint to one per cat

	string constant _JSON_FILE = '.json';

	address private _wethContract;
	address private _smartcatNftContract;
	address private _smartcatScoreContract;
	string public baseURI;
	address private _verifier;

	event BaseUriUpdate(string uri);
	event RoyaltyContractUpdate(address indexed newAddress);
	event MintFeeUpdate(uint price);
	event SetVerifier(address verifier);

	error OnlyForSmartCatHolders();
	error SmartCatMustBeAdoptedToMint();
	error MintLimitReached();
	error CatAlreadyPlayedWithToy();
	error NonZeroBalanceRequired();
	error WethNotAllowed();
	error ExistingTokenRequired();
	error MintingNotStarted();
	error WrongSigner();
	error InvalidSignature();

	error NeedToOwnTheToy(uint tokenId);
	error OnlyOneToyMintAllowed();
	error OnlyOneToyMintPerCatAllowed();

	/// @custom:oz-upgrades-unsafe-allow constructor
	constructor() {
		_disableInitializers();
	}

	function initialize(
		address initialOwner,
		address wethContract,
		address smartcatNftContract,
		address smartcatScoreContract
	) public initializer {
		__ERC721_init('SmartCat Loot', 'SCL');
		__Ownable_init(initialOwner);
		_updateMintFee(0.1 ether);
		_maxTokens = 1000;

		_setRoyalty(10 * 100); // 10% royalty fee

		_wethContract = wethContract;
		_smartcatNftContract = smartcatNftContract;
		_smartcatScoreContract = smartcatScoreContract;

		mintStartTime = 1702962000; // Initialise to UTC 05:00 19/12/2023
	}

	function pointsPerPlay() external pure returns (uint){
		return POINTS_PER_PLAY;
	}

	function setBaseURI(string calldata newBaseURI) external onlyOwner {
		baseURI = newBaseURI;
		emit BaseUriUpdate(newBaseURI);
	}

	function tokenURI(
		uint256 tokenId
	) public view override returns (string memory) {
		return
			string(abi.encodePacked(baseURI, tokenId.toString(), _JSON_FILE));
	}

	function updateMintFee(uint256 newMintFee) public onlyOwner {
		_updateMintFee(newMintFee);
	}

	function setSmartCatLootPool(address lootPoolContract) public onlyOwner {
		_smartCatLootPool = lootPoolContract;
	}

	function setSmartCatMintFeePool(address mintFeePool) public onlyOwner {
		_smartCatMintFeePool = mintFeePool;
	}

	function _updateMintFee(uint256 newMintFee) internal {
		_purchasePrice = newMintFee;
		emit MintFeeUpdate(newMintFee);
	}

	function updateStartTime(uint256 newStartTime) public onlyOwner {
		mintStartTime = newStartTime;
	}

	function royaltyInfo(
		uint256 tokenId,
		uint256 salePrice
	)
		external
		view
		virtual
		override
		returns (address receiver, uint256 royaltyAmount)
	{
		_requireOwned(tokenId);
		receiver = address(_smartCatLootPool);
		royaltyAmount = (_getRoyalty() * salePrice) / 10000;
	}

	function getMessageHash() public view returns (bytes32) {
		return keccak256(abi.encodePacked(STAGE1_PREFIX, _msgSender()));
	}

	function getEthSignedMessageHash(
		bytes32 messageHash
	) public pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					'\x19Ethereum Signed Message:\n32',
					messageHash
				)
			);
	}

	function recover(
		bytes32 hash,
		uint8 v,
		bytes32 r,
		bytes32 s
	) public pure returns (address) {
		return ecrecover(hash, v, r, s);
	}

	function setVerifier(address newVerifier) external onlyOwner {
		_verifier = newVerifier;
		// emit SetVerifier(newVerifier);
	}

	function canBuy(uint256 smartcatTokenId, bytes memory signature) public view returns (bool) {
		if (block.timestamp < mintStartTime) revert MintingNotStarted();
		if (block.timestamp < (mintStartTime + 24 * 60 * 60)) {
			if (signature.length != 65) {
				revert InvalidSignature();
			}
			uint8 v;
			bytes32 r;
			bytes32 s;
			assembly {
				// first 32 bytes, after the length prefix.
				r := mload(add(signature, 32))
				// second 32 bytes.
				s := mload(add(signature, 64))
				// final byte (first byte of the next 32 bytes).
				v := byte(0, mload(add(signature, 96)))
			}
			if (
				_verifier !=
				recover(getEthSignedMessageHash(getMessageHash()), v, r, s)
			) {
				revert WrongSigner();
			}
		}
		if (_walletHasMinted[msg.sender]) revert OnlyOneToyMintAllowed();
		if (_catHasMinted[smartcatTokenId])
			revert OnlyOneToyMintPerCatAllowed();

		// Is smartcat owned by minter?
		if (
			IERC721(_smartcatNftContract).ownerOf(smartcatTokenId) !=
			address(msg.sender)
		) {
			revert OnlyForSmartCatHolders();
		}

		if (
			ISmartCatScore(_smartcatScoreContract).getLevel(smartcatTokenId) ==
			0
		) {
			revert SmartCatMustBeAdoptedToMint();
		}

		return true;
	}

	function buy(uint256 smartcatTokenId, bytes memory signature) public {
		if (!canBuy(smartcatTokenId, signature)) {
			//nop; // can never reach here
		}

		uint256 mintPortion = _feeMultiplier(
			getMintPrice(),
			WITHDRAW_DEPOSIT_FACTOR
		);
		uint256 feeVal = getMintPrice() - mintPortion;

		//require transfer of _purchasePrice WETH this will revert if balance not available or approved
		SafeERC20.safeTransferFrom(
			IERC20(_wethContract),
			msg.sender,
			address(this),
			mintPortion
		);

		SafeERC20.safeTransferFrom(
			IERC20(_wethContract),
			msg.sender,
			address(_smartCatMintFeePool),
			feeVal
		);

		_mintInternal(msg.sender);
		_walletHasMinted[msg.sender] = true;
		_catHasMinted[smartcatTokenId] = true;
	}

	function _mintInternal(address to) private {
		if (getNextTokenId() >= _maxTokens) {
			revert MintLimitReached();
		}
		uint256 tokenId = _prepareTokenId();
		_safeMint(to, tokenId);
	}

	function tokensMinted() public view returns (uint256) {
		return getNextTokenId();
	}

	function play(uint256 tokenId, uint256 smartcatTokenId) public {
		//require address to own toy and adopted cat
		if (msg.sender != _requireOwned(tokenId)) {
			revert NeedToOwnTheToy(tokenId);
		}
		//Is smartcat owned by minter?
		if (
			IERC721(_smartcatNftContract).ownerOf(smartcatTokenId) !=
			address(msg.sender)
		) {
			revert OnlyForSmartCatHolders();
		}

		//check this cat hasn't already played with the toy
		if (hasCatPlayed(tokenId, smartcatTokenId) == true) {
			revert CatAlreadyPlayedWithToy();
		}

		// mark played
		_playMatrix[tokenId].push(smartcatTokenId);
		// option: change to mapping or mapping + index(Set)
		// _playSet[tokenId].add(smartcatTokenId);

		//add SL points
		pointBalances[tokenId] += POINTS_PER_PLAY;
	}

	function burn(uint256 tokenId) public override {
		// return burn value to owner
		// now return burn value of any matic in the protocol
		address owner = ownerOf(tokenId);
		(
			uint256 burnShareWETH,
			uint256 poolAContribution
		) = calculateBurnValues();
		IERC20(_wethContract).transfer(owner, burnShareWETH); // Take WETH from this contract (mint pool)
		ISmartCatLootPool(_smartCatLootPool).takePoolA(
			owner,
			poolAContribution,
			totalSupply()
		); // Take WETH and Matic from royalties

		_burn(tokenId); // internal _update function handles burn permission
	}

	function calculateBurnValues()
		public
		view
		returns (uint256 mintShareWeth, uint256 poolAContribution)
	{
		uint256 supply = totalSupply();
		if (supply > 0) {
			mintShareWeth =
				IERC20(_wethContract).balanceOf(address(this)) /
				supply;
			poolAContribution =
				ISmartCatLootPool(_smartCatLootPool).calculatePoolA() /
				supply;
		}
	}

	function expectedBurnValue()
		public
		view
		returns (uint256 burnShareWETH, uint256 burnShareMatic)
	{
		uint256 poolAContribution;
		(burnShareWETH, poolAContribution) = calculateBurnValues();
		burnShareWETH += poolAContribution;
		uint256 totalSupply = totalSupply();
		if (totalSupply > 0) {
			burnShareMatic =
				ISmartCatLootPool(_smartCatLootPool).getPoolAMatic() /
				totalSupply;
		}
	}

	// helper functions for card visibility
	// TODO maybe refactor to thr mapping or IndexedSet
	function hasCatPlayed(
		uint256 tokenId,
		uint256 smartcatTokenId
	) public view returns (bool) {
		uint256[] memory catsUsedToy = _playMatrix[tokenId];
		for (uint256 i = 0; i < catsUsedToy.length; i++) {
			if (catsUsedToy[i] == smartcatTokenId) {
				return true;
			}
		}
		return false;

		// return _playSet[tokenId].contains(smartcatTokenId);
	}

	//helper function for stats
	function catsThatHavePlayed(
		uint256 tokenId
	) public view returns (uint256[] memory) {
		return _playMatrix[tokenId];
		// return _playSet[tokenId].values();
	}

	function pointsBalance(uint256 tokenId) public view returns (uint256) {
		return pointBalances[tokenId];
	}

	function maticPayout() public view returns (uint256 burnShareMatic) {
		(, burnShareMatic) = expectedBurnValue();
	}

	function wethPayout() public view returns (uint256 burnShareWETH) {
		(burnShareWETH, ) = expectedBurnValue();
	}

	struct CatListItem {
		uint256 tokenId;
		string tokenUri;
		address owner;
		uint8 level;
	}

	function getCatsList(
		uint256 toyId
	) public view returns (CatListItem[] memory) {
		uint256[] memory playedIds = _playMatrix[toyId];
		// uint256[] memory playedIds = _playSet[toyId].values();
		ISmartCatScore scoreContract = ISmartCatScore(_smartcatScoreContract);
		ERC721URIStorage nftContract = ERC721URIStorage(_smartcatNftContract);

		CatListItem[] memory list = new CatListItem[](playedIds.length);

		for (uint i = 0; i < playedIds.length; i++) {
			uint256 tokenId = playedIds[i];

			list[i] = CatListItem(
				tokenId,
				nftContract.tokenURI(tokenId),
				nftContract.ownerOf(tokenId),
				scoreContract.getLevel(tokenId)
			);
		}

		return list;
	}

	// Return TX fee

	/**
	 * @notice  1% = 1000points
	 * @param   value  100% value
	 * @param   feeValue  number of percents / 1000 to return
	 * @return  result  percentage of value
	 */
	function _feeMultiplier(
		uint256 value,
		uint256 feeValue
	) private pure returns (uint256 result) {
		result = (value * feeValue) / _FEE_DECIMALS;
	}

	/**
	 * @notice  NB: The transfer fees we receive already have the protocol % fee applied,
	 *		  So we need a compound calculation here
	 * @dev	 50% * royalties + 50% * protocol fee (10%) * deposit + 90% of deposit
	 *		  = 50% royalties + 95% deposit
	 * @return  poolA  .
	 */
	function calculatePoolA() public view returns (uint256 poolA) {
		poolA =
			ISmartCatLootPool(_smartCatLootPool).calculatePoolA() +
			IERC20(_wethContract).balanceOf(address(this));
	}

	function getMintPrice() public view returns (uint256) {
		return _purchasePrice;
	}

	function contractURI() public view returns (string memory) {
		return string(abi.encodePacked(baseURI, 'contract.json'));
	}

	function setMaxTokens(uint256 newMaxTokens) public onlyOwner {
		_maxTokens = newMaxTokens;
	}

	function hasMinted(
		address owner,
		uint256 catId
	) public view returns (bool) {
		return (_catHasMinted[catId] || _walletHasMinted[owner]);
	}

	function _update(
		address to,
		uint256 tokenId,
		address auth
	)
		internal
		override(ERC721Upgradeable, ERC721OptimizedEnumerableUpgradeable)
		returns (address)
	{
		return ERC721OptimizedEnumerableUpgradeable._update(to, tokenId, auth);
	}

	function supportsInterface(
		bytes4 interfaceId
	)
		public
		view
		override(
			ERC5169,
			ERC721Upgradeable,
			ERC721OptimizedEnumerableUpgradeable,
			DerivedERC2981Royalty
		)
		returns (bool)
	{
		return
			ERC721OptimizedEnumerableUpgradeable.supportsInterface(
				interfaceId
			) ||
			DerivedERC2981Royalty.supportsInterface(interfaceId) ||
			ERC5169.supportsInterface(interfaceId);
	}

	// ERC-5169
	function _authorizeSetScripts(
		string[] memory
	) internal view override(ERC5169) onlyOwner {
		// require(msg.sender == owner(), "You do not have the authority to set the script URI");
	}
}
