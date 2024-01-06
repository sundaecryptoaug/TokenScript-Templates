import {ethers, upgrades} from "hardhat";

async function main() {

	//const proxyAddress = "0x9A676e781A523b5d0C0e43731313A708CB607508"; // Hardhat local
	const proxyAddress = "0x3F1108368CBa706990590d15ce7ADDEE8224203B"; // Mumbai

	const SmartCatTreats = await ethers.getContractFactory("SmartCatLoot");
	const smartCatUpgrade = await upgrades.upgradeProxy(proxyAddress, SmartCatTreats);
	await smartCatUpgrade.waitForDeployment();

	console.log(
		`loot contract upgraded: ${await smartCatUpgrade.getAddress()}`
	);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
