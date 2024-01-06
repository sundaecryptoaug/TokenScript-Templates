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

/*export async function getBirthday(token){

	const nftContract = getNftContract(token);

	const receivedLogs = await nftContract.queryFilter(
		nftContract.filters.Transfer(ZeroAddress, null, token.tokenId),
	);

	console.log("Logs: ", receivedLogs);
}*/

export async function getInviteList(token){

	const contract = getContract(token);

	const res = await contract["getPlayInvitesList"](BigInt(token.tokenId));

	const playRequests = convertListResponse(res);

	console.log("Play requests: ", playRequests);

	return playRequests;
}

export async function getFriendsList(token){

	const contract = getContract(token);

	const res = await contract["getFriendsList"](BigInt(token.tokenId));

	const playRequests = convertListResponse(res);

	//console.log("Friends: ", playRequests);

	return playRequests;
}

export async function getPendingInvites(token){

	const contract = getContract(token);

	const res = await contract["getPendingInvitesList"](BigInt(token.tokenId));

	const pendingInvites = convertListResponse(res);

	//console.log("Friends: ", playRequests);

	return pendingInvites;
}

export interface CatListItem {
	tokenId: string,
	tokenUri: string,
	owner: string,
	level: number,
	canPlay: boolean
}

function convertListResponse(res): CatListItem[] {
	return Array.from(res).map(([tokenId, tokenUri, owner, level, canPlay]) => {
		return {
			tokenId,
			tokenUri,
			owner,
			level,
			canPlay
		} as CatListItem
	});
}

export async function getCatState(token){

	const contract = getContract(token);

	const res = await contract["getCatInfo2"](BigInt(token.tokenId));

	const data:any = {};

	({
		0: data.level,
		1: data.numFeeds,
		2: data.lastFeed,
		3: data.numPlays,
		4: data.lastPlay,
		5: data.numCleans,
		6: data.lastClean,
		7: data.friends
	} = res[0]);

	data.pointsBalance = res[1];
	data.actionLimitReset = res[2];
	data.actionLimitCount = res[3];

	data.friends = Array.from(data.friends);

	const config = await contract["getConfig2"]();

	const minIntervals = config[0];

	data.nextFeed = Math.max(Number(data.lastFeed + minIntervals[0]), Number(data.actionLimitReset));
	data.nextPlay = Math.max(Number(data.lastPlay + minIntervals[1]), Number(data.actionLimitReset));
	data.nextClean = Math.max(Number(data.lastClean + minIntervals[2]), Number(data.actionLimitReset));

	const minLevels = config[1];

	data.levelThresholds = {
		feed: minLevels[0],
		play: minLevels[1],
		clean: minLevels[2],
	}

	data.maxActions = config[3];

	console.log("Cat state: ", data);

	/*const allCatsRes = await contract["getAllCats"]();

	const allCats = Array.from(allCatsRes).map((cat) => {
		return {
			tokenId: cat[0],
			owner: cat[1],
			level: cat[2]
		}
	})

	console.log("All cats: ", allCats);*/

	return data;
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

	const CONTRACT_ADDRESS = //"0x7573933eB12Fa15D5557b74fDafF845B3BaF0ba2"; // Polygon mainnet
		"0xDDC2388Bd646432DFf29B75A361060D26C2f8397"; // Polygon mumbai
		//"0x97378881EE853457bC8743C882EBDBD57312ed33"; // New sepolia deployment
		//"0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"; // Hardhat local

	// TODO: get contract address from engine by origin name.
	return new Contract(CONTRACT_ADDRESS, [
		{
			"inputs": [],
			"name": "getConfig2",
			"outputs": [
				{
					"internalType": "uint256[3]",
					"name": "",
					"type": "uint256[3]"
				},
				{
					"internalType": "uint16[3]",
					"name": "",
					"type": "uint16[3]"
				},
				{
					"internalType": "uint8",
					"name": "",
					"type": "uint8"
				},
				{
					"internalType": "uint16",
					"name": "",
					"type": "uint16"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "tokenId",
					"type": "uint256"
				}
			],
			"name": "getCatInfo2",
			"outputs": [
				{
					"components": [
						{
							"components": [
								{
									"internalType": "uint8",
									"name": "level",
									"type": "uint8"
								},
								{
									"internalType": "uint16",
									"name": "numFeeds",
									"type": "uint16"
								},
								{
									"internalType": "uint256",
									"name": "lastFeed",
									"type": "uint256"
								},
								{
									"internalType": "uint16",
									"name": "numPlays",
									"type": "uint16"
								},
								{
									"internalType": "uint256",
									"name": "lastPlay",
									"type": "uint256"
								},
								{
									"internalType": "uint16",
									"name": "numCleans",
									"type": "uint16"
								},
								{
									"internalType": "uint256",
									"name": "lastClean",
									"type": "uint256"
								},
								{
									"internalType": "uint256[]",
									"name": "friends",
									"type": "uint256[]"
								}
							],
							"internalType": "struct SmartCatProxyV3.CatState",
							"name": "state",
							"type": "tuple"
						},
						{
							"internalType": "uint256",
							"name": "pointsBalance",
							"type": "uint256"
						},
						{
							"internalType": "uint256",
							"name": "actionLimitReset",
							"type": "uint256"
						},
						{
							"internalType": "uint16",
							"name": "actionLimitCount",
							"type": "uint16"
						}
					],
					"internalType": "struct SmartCatProxyV3.CatInfo2",
					"name": "",
					"type": "tuple"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "tokenId",
					"type": "uint256"
				}
			],
			"name": "getPlayInvitesList",
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
						},
						{
							"internalType": "bool",
							"name": "canPlay",
							"type": "bool"
						}
					],
					"internalType": "struct SmartCat.CatListItem[]",
					"name": "",
					"type": "tuple[]"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "tokenId",
					"type": "uint256"
				}
			],
			"name": "getFriendsList",
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
						},
						{
							"internalType": "bool",
							"name": "canPlay",
							"type": "bool"
						}
					],
					"internalType": "struct SmartCat.CatListItem[]",
					"name": "",
					"type": "tuple[]"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "tokenId",
					"type": "uint256"
				}
			],
			"name": "getPendingInvitesList",
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
						},
						{
							"internalType": "bool",
							"name": "canPlay",
							"type": "bool"
						}
					],
					"internalType": "struct SmartCatProxyV3.CatListItem[]",
					"name": "",
					"type": "tuple[]"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
	], provider);
}

export function getLootContract(){

	const provider = getEthersProvider();

	const CONTRACT_ADDRESS = "0x3F1108368CBa706990590d15ce7ADDEE8224203B"; // Polygon mumbai
		//"0x9A676e781A523b5d0C0e43731313A708CB607508"; // Hardhat local

	return new Contract(CONTRACT_ADDRESS, [
		{
			"inputs": [],
			"name": "mintStartTime",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "tokensMinted",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
	], provider);
}

/*function getNftContract(token) {

	const provider = getEthersProvider();

	const CONTRACT_ADDRESS = //"0xD5cA946AC1c1F24Eb26dae9e1A53ba6a02bd97Fe"; // Polygon mainnet
		"0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Hardhat local
	// "0xA04664f6191D9A65F5F48c6F9d6Dd81CB636E65c"; // Initial sepolia deployment

	// TODO: get contract address from engine by origin name.
	return new Contract(CONTRACT_ADDRESS, [
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": true,
					"internalType": "address",
					"name": "from",
					"type": "address"
				},
				{
					"indexed": true,
					"internalType": "address",
					"name": "to",
					"type": "address"
				},
				{
					"indexed": true,
					"internalType": "uint256",
					"name": "tokenId",
					"type": "uint256"
				}
			],
			"name": "Transfer",
			"type": "event"
		}
	], provider);

}*/
