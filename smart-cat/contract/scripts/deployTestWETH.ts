import {ethers} from "hardhat";

async function main() {

	const [owner] = await ethers.getSigners();

	const WrappedEthereumTest = await ethers.getContractFactory("WrappedEthereumTest");
	const wrappedEthereumTest = await WrappedEthereumTest.deploy(owner.address);
	await wrappedEthereumTest.waitForDeployment();

	console.log("WETH contract deployed: ", wrappedEthereumTest.target);

	await wrappedEthereumTest.mint("0x8646DF47d7b16Bf9c13Da881a2D8CDacDa8f5490", ethers.parseUnits("1", 'ether'));

	console.log('Minted test wETH');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

