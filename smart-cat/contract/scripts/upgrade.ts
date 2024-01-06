import {ethers, upgrades} from "hardhat";

async function main() {

	const proxyAddress = "0x7573933eB12Fa15D5557b74fDafF845B3BaF0ba2"; // Polygon mainnet
	//const proxyAddress = "0xDDC2388Bd646432DFf29B75A361060D26C2f8397"; // Polygon mumbai
	//const proxyAddress = "0x97378881EE853457bC8743C882EBDBD57312ed33"; // Sepolia
	//const proxyAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"; // Hardhat localhost

	const SmartCatProxy = await ethers.getContractFactory("SmartCatProxyV3");
	const smartCatUpgrade = await upgrades.upgradeProxy(proxyAddress, SmartCatProxy, {
		call: {fn: "upgradeV3", args: []}
	});
	await smartCatUpgrade.waitForDeployment();

	console.log(
		`score contract upgraded: ${await smartCatUpgrade.getAddress()}`
	);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
