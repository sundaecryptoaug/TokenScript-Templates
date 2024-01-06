import hre from "hardhat";

async function main() {
	const contractAddress = "0x1d6E5bcF82D2515214D2EB0d4a79Ca35a2428827";
	const recipient = "0x6Ec7f95eb5D11850c26CDF4A7feDa06Ea831dCdD";
	const tokenId = 58;
	const tokenUri = "token.json";

	const myContract = await hre.ethers.getContractAt("SmartCatNFT", contractAddress);

	const mintToken = await myContract.safeMint(recipient, tokenId, tokenUri);

	console.log("Trx hash:", mintToken.hash);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
