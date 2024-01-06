import {ethers, network, upgrades} from "hardhat";

async function main() {

	const nftContract = //"0xD5cA946AC1c1F24Eb26dae9e1A53ba6a02bd97Fe"; // Mainnet
		"0x614cF3021705977c2eF4beb9D7f10a6bF4EAEBF6"; // Mumbai

	const SmartCatProxy = await ethers.getContractFactory("SmartCatProxyV3");
	const scoreContract = await upgrades.deployProxy(SmartCatProxy, [nftContract]);

	await scoreContract.waitForDeployment();

	console.log(
		`contract deployed to ${scoreContract.target}`
	);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
