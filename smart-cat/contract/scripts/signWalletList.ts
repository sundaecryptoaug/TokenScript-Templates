
import fs from "fs";
import {ethers} from "ethers";

async function signForMint(signer: any, sender: string) {
	let msgSenderArray = ethers.getBytes(sender);

	let prefixArray = ethers.toUtf8Bytes('Stage 1 allowed for ');

	var toSign = new Uint8Array([...prefixArray, ...msgSenderArray]);
	let hashed = ethers.keccak256(toSign);
	return await signer.signMessage(ethers.getBytes(hashed));
}

const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;

async function signWalletsArray(wallets: string[], signer: any){
	const signed:string[][] = [];

	wallets = wallets.map((wallet) => {
		wallet = wallet.replace(/^"+|"+$/g, '');
		return wallet;
	})

	await Promise.all(
		wallets.map(async (walletAddress:string) => {
			if (ethereumAddressRegex.test(walletAddress)){
				const signature = await signForMint(signer, walletAddress)
				signed.push([walletAddress, signature])
			}
		}));
	return signed;
}

function signedwalletsToCsv(signedWallets:string[][]): string{
	let csv = "WalletAddress,Signature\r\n"
	signedWallets.forEach((item:string[]) =>{
		csv += `"${item[0]}","${item[1]}"\r\n`
	})
	return csv;
}

async function main() {

	// load signer key
	const keyHex = fs.readFileSync(__dirname + "/../../tokenscript/ts-signing.key", "utf-8").trim();
	const signer = new ethers.Wallet(keyHex);

	// read single column CSV with list of walletAddresses
	const walletList = fs.readFileSync(__dirname + '/../data/cat_list.csv', 'utf8');

	// sign every walletAddress in the list, skip header
	const signedWallets = await signWalletsArray(walletList.split(/\s+/), signer);

	// format data as CSV
	let csv = await signedwalletsToCsv(signedWallets)

	// save CSV to file
	fs.writeFileSync(__dirname + '/../data/signed_list.csv', csv);

	const jsonObject = signedWallets.reduce<{[key: string]: string }>((prev, current, index, value) => {
		prev[current[0]] = current[1];
		return prev;
	}, {});

	fs.writeFileSync(__dirname + '/../data/signed_list.json', JSON.stringify(jsonObject, undefined, "\t"));
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
