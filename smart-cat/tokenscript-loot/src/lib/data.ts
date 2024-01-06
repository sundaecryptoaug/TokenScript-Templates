import {Contract, JsonRpcProvider, Network} from "ethers";

const ensLookupCache: {[address: string]: string|null} = {};

export async function lookupEnsName(address: string){

	if (ensLookupCache[address])
		return ensLookupCache[address];

	try {
		const res = await fetch(`https://api.token-discovery.tokenscript.org/ens/reverse?address=${address}`);
		const data = await res.json();
		ensLookupCache[address] = data?.ensName ?? null;
	} catch (e){
		ensLookupCache[address] = null;
	}

	return ensLookupCache[address];
}

export async function getCatsList(token){

	const contract = getContract(token);

	const res = await contract["getCatsList"](BigInt(token.tokenId));

	return convertListResponse(res);
}

export interface CatListItem {
	tokenId: string,
	tokenUri: string,
	owner: string,
	level: number
}

function convertListResponse(res): CatListItem[] {
	return Array.from(res).map(([tokenId, tokenUri, owner, level, canPlay]) => {
		return {
			tokenId,
			tokenUri,
			owner,
			level
		} as CatListItem
	});
}

function getEthersProvider(){

	// @ts-ignore
	const network = new Network("polygon", chainID);

	// @ts-ignore
	const RPC_URL = rpcURL;
	// const RPC_URL = "https://rpc.ankr.com/polygon";
	//const RPC_URL = "https://sepolia.infura.io/v3/9f79b2f9274344af90b8d4e244b580ef"; // should use engine provided "rpcUrl", but AW has issues at the moment.

	return new JsonRpcProvider(RPC_URL, network, {
		staticNetwork: network
	});
}

function getContract(token){

	const provider = getEthersProvider();

	const CONTRACT_ADDRESS = "0x3F1108368CBa706990590d15ce7ADDEE8224203B"; // Polygon mumbai
		//"0x9a676e781a523b5d0c0e43731313a708cb607508"; // Hardhat local

	// TODO: get contract address from engine by origin name.
	return new Contract(CONTRACT_ADDRESS, [
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "toyId",
					"type": "uint256"
				}
			],
			"name": "getCatsList",
			"outputs": [
				{
					"components": [
						{
							"internalType": "uint256",
							"name": "tokenId",
							"type": "uint256"
						},
						{
							"internalType": "string",
							"name": "tokenUri",
							"type": "string"
						},
						{
							"internalType": "address",
							"name": "owner",
							"type": "address"
						},
						{
							"internalType": "uint8",
							"name": "level",
							"type": "uint8"
						}
					],
					"internalType": "struct SmartCatLoot.CatListItem[]",
					"name": "",
					"type": "tuple[]"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
	], provider);
}
