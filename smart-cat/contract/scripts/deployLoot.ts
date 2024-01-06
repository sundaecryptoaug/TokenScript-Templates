import {ethers, upgrades} from "hardhat";

async function main() {

	// Mumbai
	const SMARTCAT_NFT_ADDRESS = "0x614cF3021705977c2eF4beb9D7f10a6bF4EAEBF6";
	const SMARTCAT_SCORE_ADDRESS = "0xDDC2388Bd646432DFf29B75A361060D26C2f8397";
	const WETH_ADDRESS = "0x3B0deCF3FCe1abD6717B045C47f4558C67fE79fa";

	const SmartCatLoot = await ethers.getContractFactory("SmartCatLoot");
	const smartCatLoot = await upgrades.deployProxy(SmartCatLoot, ["0x0C6E7F5E40Fc654423E00F9C73dDa496e2c704B8", WETH_ADDRESS, SMARTCAT_NFT_ADDRESS, SMARTCAT_SCORE_ADDRESS]);
	await smartCatLoot.waitForDeployment();

	await smartCatLoot.setScriptURI(["https://viewer-staging.tokenscript.org/assets/tokenscripts/smart-cat-loot-mumbai.tsml"]);
	await smartCatLoot.setBaseURI("https://viewer-staging.tokenscript.org/assets/tokenscripts/smart-cat/loot-meta/");

	console.log("SmartCatLoot deployed: ", smartCatLoot.target);

	const ownerAddress = await smartCatLoot.owner();

	const SmartCatLootPool = await ethers.getContractFactory('SmartCatLootPool');
	const smartCatLootRoyaltyPool = await upgrades.deployProxy(SmartCatLootPool, [
		ownerAddress,
		WETH_ADDRESS,
		smartCatLoot.target
	]);

	const SmartCatLootMintFeePool = await ethers.getContractFactory('SmartCatMintFeePool');
	const smartCatLootMintFeePool = await upgrades.deployProxy(SmartCatLootMintFeePool, [
		ownerAddress,
		WETH_ADDRESS,
		smartCatLootRoyaltyPool.target
	]);

	await smartCatLoot.setSmartCatMintFeePool(smartCatLootMintFeePool.target);
	await smartCatLootRoyaltyPool.setSmartCatMintFeePool(smartCatLootMintFeePool.target);
	await smartCatLoot.setSmartCatLootPool(smartCatLootRoyaltyPool.target);

	console.log("SmartCatLootPool (Royalty handler) deployed: ", smartCatLootRoyaltyPool.target);
	console.log("SmartCatLootMintFeePool (STL & Pool B share of mint fee) deployed: ", smartCatLootMintFeePool.target);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
