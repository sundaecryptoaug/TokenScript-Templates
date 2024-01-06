import {ethers, network, upgrades} from "hardhat";
import {SmartCatLoot, SmartCatProxyV3} from "../typechain-types";

async function main() {

	const [owner, addr1] = await ethers.getSigners();

	const nft = await ethers.deployContract("SmartCatNFT");

	await nft.waitForDeployment();

	console.log(`NFT contract deployed to ${nft.target}`);

	const SmartCatProxy = await ethers.getContractFactory("SmartCatProxyV2");
	const scoreContract = await upgrades.deployProxy(SmartCatProxy, [nft.target]);

	await scoreContract.waitForDeployment();

	const SmartCatProxyV2 = await ethers.getContractFactory("SmartCatProxyV3");
	const smartCatUpgrade = await upgrades.upgradeProxy(scoreContract.target, SmartCatProxyV2, {
		call: {fn: "upgradeV3", args: []}
	});
	await smartCatUpgrade.waitForDeployment();

	console.log(
		`score contract deployed to ${scoreContract.target}`
	);

	/*const SmartCatTreats = await ethers.getContractFactory("SmartCatTreats");
	const smartCatTreats = await upgrades.deployProxy(SmartCatTreats, [scoreContract.target]);
	await smartCatTreats.waitForDeployment();

	console.log(
		`cat treats ERC20 contract deployed to ${smartCatTreats.target}`
	);

	await smartCatUpgrade.setPointsContract(smartCatTreats.target);*/

	if (network.name !== "localhost")
		return;

	await nft.safeMint("0x8646DF47d7b16Bf9c13Da881a2D8CDacDa8f5490", 1, "token.json");
	await nft.safeMint("0x8646DF47d7b16Bf9c13Da881a2D8CDacDa8f5490", 2, "token.json");

	// Local network only
	await addr1.sendTransaction({to: "0x8646DF47d7b16Bf9c13Da881a2D8CDacDa8f5490", from: addr1, value: ethers.parseUnits("1", 'ether')});

	//await nft.safeMint("0xcFF805b714b24b3dD30cB4a1bea3745e5C5E73ef", 3, "token.json");
	//await nft.safeMint("0xcFF805b714b24b3dD30cB4a1bea3745e5C5E73ef", 4, "token.json");
	//await addr1.sendTransaction({to: "0xcFF805b714b24b3dD30cB4a1bea3745e5C5E73ef", from: addr1, value: ethers.parseUnits("1", 'ether')});

	console.log("Test cats minted!");

	await smartCatUpgrade.setAuthedProxyAddresses([owner.address]);
	await smartCatUpgrade.feedCat(1);
	await smartCatUpgrade.feedCat(2);

	console.log("Cats adopted!");

	const WrappedEthereumTest = await ethers.getContractFactory("WrappedEthereumTest");
	const wrappedEthereumTest = await WrappedEthereumTest.deploy(owner.address);
	await wrappedEthereumTest.waitForDeployment();

	console.log("WETH contract deployed: ", wrappedEthereumTest.target);

	await wrappedEthereumTest.mint("0x8646DF47d7b16Bf9c13Da881a2D8CDacDa8f5490", ethers.parseUnits("1", 'ether'));

	console.log('Minted test wETH')

	const SmartCatLoot = await ethers.getContractFactory("SmartCatLoot");
	const smartCatLoot = await upgrades.deployProxy(SmartCatLoot, [owner.address, wrappedEthereumTest.target, nft.target, smartCatUpgrade.target]);
	await smartCatLoot.waitForDeployment();

	console.log("SmartCatLoot deployed: ", smartCatLoot.target);

	const SmartCatLootPool = await ethers.getContractFactory('SmartCatLootPool');
	const smartCatLootRoyaltyPool = await upgrades.deployProxy(SmartCatLootPool, [
		owner.address,
		wrappedEthereumTest.target,
		smartCatLoot.target
	]);

	const SmartCatLootMintFeePool = await ethers.getContractFactory('SmartCatMintFeePool');
	const smartCatLootMintFeePool = await upgrades.deployProxy(SmartCatLootMintFeePool, [
		owner.address,
		wrappedEthereumTest.target,
		smartCatLootRoyaltyPool.target
	]);

	await smartCatLoot.setSmartCatMintFeePool(smartCatLootMintFeePool.target);
	await smartCatLootRoyaltyPool.setSmartCatMintFeePool(smartCatLootMintFeePool.target);
	await smartCatLoot.setSmartCatLootPool(smartCatLootRoyaltyPool.target);

	console.log("SmartCatLootPool (Royalty handler) deployed: ", smartCatLootRoyaltyPool.target);
	console.log("SmartCatLootMintFeePool (STL & Pool B share of mint fee) deployed: ", smartCatLootMintFeePool.target);

	// Mint test cat loot
	//await smartCatLoot.safeMint("0x8646DF47d7b16Bf9c13Da881a2D8CDacDa8f5490", "0.json");
	await smartCatLoot.updateStartTime(Math.floor(Date.now() / 1000) + 90);
	await smartCatLoot.setBaseURI("https://viewer-staging.tokenscript.org/assets/tokenscripts/smart-cat/loot-meta/");

	// Send wETH & matic to contract
	await wrappedEthereumTest.mint(smartCatLootRoyaltyPool.target, ethers.parseUnits("0.1", 'ether'));
	await addr1.sendTransaction({to: smartCatLootRoyaltyPool.target, from: addr1, value: ethers.parseUnits("1", 'ether')});

	await network.provider.send("evm_setIntervalMining", [5000]);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
