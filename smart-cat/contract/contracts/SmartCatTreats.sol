// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "stl-contracts/ERC/ERC5169.sol";

interface ISmartCatTreats is IERC20 {
	function mintFromSmartCat(address to, uint256 amount) external;
	function burnFromSmartCat(address account, uint256 amount) external;
}

contract SmartCatTreats is Initializable, ERC20Upgradeable, ERC20BurnableUpgradeable, ERC20PausableUpgradeable, OwnableUpgradeable, ERC20PermitUpgradeable, ISmartCatTreats, ERC5169 {

	address private smartCatContract;

	/// @custom:oz-upgrades-unsafe-allow constructor
	constructor() {
		_disableInitializers();
	}

	function initialize(address _smartCatContract) initializer public {
		__ERC20_init("SmartCat Treats", "SCT");
		__ERC20Burnable_init();
		__ERC20Pausable_init();
		__Ownable_init(msg.sender);
		__ERC20Permit_init("SmartCat Treats");
		smartCatContract = _smartCatContract;
	}

	function decimals() public pure override returns (uint8) {
		return 0;
	}

	function setSmartCatContract(address _smartCatContract) public onlyOwner {
		smartCatContract = _smartCatContract;
	}

	function pause() public onlyOwner {
		_pause();
	}

	function unpause() public onlyOwner {
		_unpause();
	}

	function mint(address to, uint256 amount) public onlyOwner {
		_mint(to, amount);
	}

	modifier onlySmartCat {
		require(msg.sender == smartCatContract);
		_;
	}

	function mintFromSmartCat(address to, uint256 amount) external {
		_mint(to, amount);
	}

	function burnFromSmartCat(address account, uint256 amount) external {
		_burn(account, amount);
	}

	// The following functions are overrides required by Solidity.

	function _update(address from, address to, uint256 value)
	internal
	override(ERC20Upgradeable, ERC20PausableUpgradeable)
	{
		super._update(from, to, value);
	}

	function _authorizeSetScripts(string[] memory) internal view override(ERC5169) {
		require(msg.sender == owner(), "You do not have the authority to set the script URI");
	}
}
