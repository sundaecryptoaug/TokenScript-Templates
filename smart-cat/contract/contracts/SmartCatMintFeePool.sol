// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract SmartCatMintFeePool is Initializable, OwnableUpgradeable {
	// Initialised with WETH contract and NFT Loot contract address

	// This contract will contain 5% of the mint fee, which is distributed like this:
	// Pool B: 20%
	// STL Fee pool: 80%

	uint256 public constant POOL_B_FACTOR = 10 * 1000 * 2; // 20 %
	uint256 public constant STL_FEE_FACTOR = 40 * 1000 * 2; // 80 %
	uint256 constant _FEE_DECIMALS = 100 * 1000;

	address private _lootPoolContract;
	address private _wethContract;

	uint256 private _poolBTaken;
	uint256 private _stlFeeTaken;

	error NonZeroBalanceRequired();
	error WethNotAllowed();

	modifier onlyLootPool() {
		require(
			(_lootPoolContract == _msgSender() || owner() == _msgSender()),
			'SmartCatMintFeePool: caller is not the LootPool contract'
		);
		_;
	}

	function initialize(
		address initialOwner,
		address wethContract,
		address lootPoolContract
	) public initializer {
		_lootPoolContract = lootPoolContract;
		_wethContract = wethContract;
		__Ownable_init(initialOwner);
	}

	/**
	 * @notice  Withdraw all MATIC and WETH from STL pool minus already withdrawn
	 *          and save total values
	 */
	function withdrawSTL(address recipient) public onlyLootPool {
		// Withdraw WETH
		uint256 remainingShare = calculateSTLPool();

		if (remainingShare > 0) {
			IERC20(_wethContract).transfer(recipient, remainingShare);
			_stlFeeTaken += remainingShare;
		}
	}

	function withdrawPoolB(address recipient) public onlyLootPool {
		// Withdraw WETH for Pool B
		uint256 remainingShare = calculatePoolB();

		if (remainingShare > 0) {
			IERC20(_wethContract).transfer(recipient, remainingShare);
			_poolBTaken += remainingShare;
		}
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
	function calcFullPool() public view returns (uint256) {
		return
			IERC20(_wethContract).balanceOf(address(this)) +
			_stlFeeTaken +
			_poolBTaken;
	}

	/**
	 * @notice  We dont use it at the moment
	 * @dev     POOL_B_FACTOR[10%] * royalty + POOL_B_FACTOR[10%] * ProtocolFee[10%] * mintPrice * mintNumber)
	 * @return  poolB  .
	 */
	function calculatePoolB() public view returns (uint256 poolB) {
		poolB = _feeMultiplier(calcFullPool(), POOL_B_FACTOR) - _poolBTaken;
	}

	/**
	 * @notice  40% royalty + 4% total_fee
	 * @dev     40% * royalty + 40% * ProtocolFee[10%] * total_fee
	 * @return  stlPool  .
	 */
	function calculateSTLPool() public view returns (uint256 stlPool) {
		stlPool = _feeMultiplier(calcFullPool(), STL_FEE_FACTOR) - _stlFeeTaken;
	}

	// Payment function only callable from SmartCat, used for adding the contribution from the transaction pool
	function payWETH(
		address payable receiver,
		uint256 amount
	) public onlyLootPool {
		SafeERC20.safeTransferFrom(
			IERC20(_wethContract),
			address(this),
			receiver,
			amount
		);
	}
}
