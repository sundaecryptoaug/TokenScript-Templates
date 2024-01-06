import {ethers, upgrades} from "hardhat";

async function main() {

	//const proxyAddress = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"; // Hardhat local
	const proxyAddress = "0xB1bA9AF5C0F465eE062297DF1C0d59b2C048486b"; // Sepolia

	const SmartCatTreats = await ethers.getContractFactory("SmartCatTreats");
	const smartCatUpgrade = await upgrades.upgradeProxy(proxyAddress, SmartCatTreats);
	await smartCatUpgrade.waitForDeployment();

	console.log(
		`treats contract upgraded: ${await smartCatUpgrade.getAddress()}`
	);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
