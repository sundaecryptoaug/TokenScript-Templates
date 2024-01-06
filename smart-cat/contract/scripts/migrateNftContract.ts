import {ethers, network} from "hardhat";

async function main() {

	const currentNftContract = "0xA04664f6191D9A65F5F48c6F9d6Dd81CB636E65c";
	const newNftContract = "0x1d6E5bcF82D2515214D2EB0d4a79Ca35a2428827";

	const nftContract = await ethers.getContractAt("IERC721Enumerable", currentNftContract);
	const supply = await nftContract.totalSupply();

	console.log("Supply: ", supply);

	const tokenIdOwnerMap = {};

	for (let i=0; i<supply; i++){

		const tokenId = await nftContract.tokenByIndex(i as any);

		if (tokenId){
			tokenIdOwnerMap[tokenId] = await nftContract.ownerOf(tokenId as any);
		}
	}

	console.log("Token owners: ", tokenIdOwnerMap);

	const newContract = await ethers.getContractAt("SmartCatNFT", newNftContract);

	for (const tokenId in tokenIdOwnerMap){
		console.log("Minting tokenId " + tokenId + " to " + tokenIdOwnerMap[tokenId]);
		const tx = await newContract.safeMint(tokenIdOwnerMap[tokenId], BigInt(tokenId), "token.json");
		console.log("Trx hash:", tx.hash);
	}

	console.log("Tokens successfully migrated");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
