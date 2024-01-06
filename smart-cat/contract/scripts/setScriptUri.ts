import hre from "hardhat";

async function main() {
	//const contractAddress = "0x1d6E5bcF82D2515214D2EB0d4a79Ca35a2428827"; // Sepolia NFT
	const contractAddress = "0xB1bA9AF5C0F465eE062297DF1C0d59b2C048486b"; // Sepolia ERC20 treats

	const scriptUri = "https://viewer-staging.tokenscript.org/assets/tokenscripts/smart-cat.tsml?v1";

	const myContract = await hre.ethers.getContractAt("SmartCatNFT", contractAddress);

	const mintToken = await myContract.setScriptURI([scriptUri]);

	console.log("Trx hash:", mintToken.hash);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
