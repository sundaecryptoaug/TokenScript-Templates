// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';

import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

// Uncomment this line to use console.log
// import "hardhat/console.sol";

interface ISmartCatMintFeePool {
	function calculatePoolB() external view returns (uint256);

	function calculateSTLPool() external view returns (uint256);

	function withdrawSTL(address recipient) external;

	function withdrawPoolB(address recipient) external;
}

contract SmartCatLootPool is Initializable, OwnableUpgradeable {
	// Initialised with WETH contract and NFT Loot contract address

	// This contract will only contain the royalty payments, in both WETH and Matic (any other token can be withdrawn)
	// The breakdown of the royalties is:
	// Pool A : 50 %
	// Pool B : 10 %
	// STL Fee: 40 %

	uint256 public constant POOL_A_FACTOR = 50 * 1000;
	uint256 public constant POOL_B_FACTOR = 10 * 1000;
	uint256 public constant STL_FEE_FACTOR = 40 * 1000;
	uint256 constant _FEE_DECIMALS = 100 * 1000;

	address private _lootNftContract;
	address private _wethContract;
	address private _smartCatMintFeePool;

	uint256 private _poolATaken;
	uint256 private _poolBTaken;
	uint256 private _stlFeeTaken;

	uint256 private _poolAMatic;
	uint256 private _poolBMatic;
	uint256 private _STLMatic;

	error NonZeroBalanceRequired();
	error WethNotAllowed();

	modifier onlySmartCat() {
		require(
			(_lootNftContract == _msgSender()),
			'SmartCatLootPool: caller is not the Loot NFT contract'
		);
		_;
	}

	function initialize(
		address initialOwner,
		address wethContract,
		address lootNftContract
	) public initializer {
		_lootNftContract = lootNftContract;
		_wethContract = wethContract;
		__Ownable_init(initialOwner);
	}

	function setSmartCatMintFeePool(address mintFeePool) public onlyOwner {
		_smartCatMintFeePool = mintFeePool;
	}

	/**
	 * @notice  Withdraw all MATIC and WETH from STL pool minus already withdrawn
	 *          and save total values
	 */
	function withdrawSTL() public onlyOwner {
		// Withdraw Matic share
		if (_STLMatic > 0) {
			(bool success, ) = owner().call{value: _STLMatic}(''); // Proceed even if fails
			if (success) {
				_STLMatic = 0;
			}
		}

		// Withdraw WETH from this contract
		uint256 remainingShare = _feeMultiplier(
			calcTransactionVolume(),
			STL_FEE_FACTOR
		) - _stlFeeTaken;
		if (remainingShare > 0) {
			IERC20(_wethContract).transfer(owner(), remainingShare);
			_stlFeeTaken += remainingShare;
		}

		//And from the mint pool
		ISmartCatMintFeePool(_smartCatMintFeePool).withdrawSTL(owner());
	}

	// Note that this is a placeholder function in order to operate pool B
	// Pool B is for purchase of listed tokens.
	function withdrawPoolB() public onlyOwner {
		// Withdraw Pool B for purchase use
		if (_poolBMatic > 0) {
			(bool success, ) = owner().call{value: _poolBMatic}(''); // Proceed even if fails
			if (success) {
				_poolBMatic = 0;
			}
		}

		// Withdraw WETH for Pool B from this contract
		uint256 remainingShare = _feeMultiplier(
			calcTransactionVolume(),
			POOL_B_FACTOR
		) - _poolBTaken;
		if (remainingShare > 0) {
			IERC20(_wethContract).transfer(owner(), remainingShare);
			_poolBTaken += remainingShare;
		}

		// withdraw share from mint fee pool
		ISmartCatMintFeePool(_smartCatMintFeePool).withdrawPoolB(owner());
	}

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
	 * @notice  Compensate for STL withdraw, Pool A payouts, Pool B payouts
	 * @dev     WETH royalties income amount
	 * @return  uint256  .
	 */
	function calcTransactionVolume() public view returns (uint256) {
		//should remain constant, unless there are more deposits
		return
			IERC20(_wethContract).balanceOf(address(this)) +
			_stlFeeTaken +
			_poolATaken +
			_poolBTaken;
	}

	/**
	 * @notice  NB: The transfer fees we receive already have the protocol % fee applied,
	 *          So we need a compound calculation here
	 * @dev     50% * royalties + 50% * protocol fee (10%) * deposit + 90% of deposit
	 *          = 50% royalties + 95% deposit
	 * @return  poolA  .
	 */
	function calculatePoolA() public view returns (uint256 poolA) {
		poolA =
			_feeMultiplier(calcTransactionVolume(), POOL_A_FACTOR) -
			_poolATaken; //calculate actual pool A amount
	}

	function poolATaken() public view returns (uint256 poolA) {
		poolA = _poolATaken;
	}

	function takePoolA(
		address payable recipient,
		uint256 poolAContribution,
		uint256 supply
	) public onlySmartCat {
		IERC20(_wethContract).transfer(recipient, poolAContribution); // Take WETH from this contract
		_poolATaken += poolAContribution;

		//pay matic to this addr
		uint256 maticPayout = _poolAMatic / supply;
		(bool success, ) = recipient.call{value: maticPayout}('');
		if (success) {
			_poolAMatic -= maticPayout;
		}
	}

	function getPoolAMatic() public view returns (uint256) {
		return _poolAMatic;
	}

    function getPoolBMatic() public view returns (uint256) {
		return _poolBMatic;
	}

    function getSTLPoolMatic() public view returns (uint256) {
		return _STLMatic;
	}

	/**
	 * @dev     POOL_B_FACTOR[10%] * royalty + POOL_B_FACTOR[10%] * ProtocolFee[10%] * mintPrice * mintNumber)
	 * @return  poolB  .
	 */
	function calculatePoolB() public view returns (uint256 poolB) {
		poolB =
			_feeMultiplier(calcTransactionVolume(), POOL_B_FACTOR) -
			_poolBTaken +
			ISmartCatMintFeePool(_smartCatMintFeePool).calculatePoolB();
	}

	/**
	 * @notice  40% royalty + 4% total_fee
	 * @dev     40% * royalty + 40% * ProtocolFee[10%] * total_fee
	 * @return  stlPool  .
	 */
	function calculateSTLPool() public view returns (uint256 stlPool) {
		stlPool =
			_feeMultiplier(calcTransactionVolume(), STL_FEE_FACTOR) -
			_stlFeeTaken +
			ISmartCatMintFeePool(_smartCatMintFeePool).calculateSTLPool();
	}

	// Payment function only callable from SmartCat, used for adding the contribution from the transaction pool
	function payWETH(
		address payable receiver,
		uint256 amount
	) public onlySmartCat {
		SafeERC20.safeTransferFrom(
			IERC20(_wethContract),
			address(this),
			receiver,
			amount
		);
	}

	receive() external payable {
		//populate the pools for simpler distribution
		uint256 value = msg.value;
		_poolAMatic += (value * POOL_A_FACTOR) / _FEE_DECIMALS;
		_poolBMatic += (value * POOL_B_FACTOR) / _FEE_DECIMALS;
		_STLMatic += (value * STL_FEE_FACTOR) / _FEE_DECIMALS;
	}

	// Fallback withdraw of funds for non-WETH contract that may fall into the contract
	function withdraw(address erc20Addr) public onlyOwner {
		// require (erc20Addr != _wethContract, "Can only be used to withdraw non WETH tokens");
		if (erc20Addr == _wethContract) {
			revert WethNotAllowed();
		}
		uint256 balance = IERC20(erc20Addr).balanceOf(address(this));
		if (balance == 0) {
			revert NonZeroBalanceRequired();
		}

		SafeERC20.safeTransferFrom(
			IERC20(erc20Addr),
			address(this),
			msg.sender,
			balance
		);
	}
}
