// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./SmartCatProxy.sol";

contract SmartCatProxyUpgradeTest is SmartCatProxy {

	function upgradeTest() public pure returns (bool) {
		return true;
	}

}
