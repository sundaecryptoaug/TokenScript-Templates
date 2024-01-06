import {ethers, upgrades} from "hardhat";

async function main() {

	// Polygon Mainnet
	const SMARTCAT_NFT_ADDRESS = "0xd5ca946ac1c1f24eb26dae9e1a53ba6a02bd97fe";
	const SMARTCAT_SCORE_ADDRESS = "0x7573933eb12fa15d5557b74fdaff845b3baf0ba2";
	const WETH_ADDRESS = "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619";

	const SmartCatLoot = await ethers.getContractFactory("SmartCatLoot");
	const smartCatLoot = await upgrades.deployProxy(SmartCatLoot, ["0x1c18e4eF0C9740e258835Dbb26E6C5fB4684C7a0", WETH_ADDRESS, SMARTCAT_NFT_ADDRESS, SMARTCAT_SCORE_ADDRESS]);
	await smartCatLoot.waitForDeployment();

	//TODO: Fill in correct script and base URI for Mainnet
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
