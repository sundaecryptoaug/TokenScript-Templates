import {ethers} from "ethers";
import {env} from "../env";

const OWNER_CACHE_EXPIRY = 600 * 1000; // 10 minutes
const FRIEND_CACHE_EXPIRY = 43200 * 1000; // 12 hours

const ownerCache: {[tokenId: number]: {owner: string, timestamp: number}} = {};
const friendCache: {[tokenId: number]: {friends: {tokenId: number, owner: string}[], timestamp: number}} = {};

export async function getTokenOwner(tokenId: number){

	if (ownerCache[tokenId] && ownerCache[tokenId].timestamp + OWNER_CACHE_EXPIRY > Date.now()){
		return ownerCache[tokenId].owner;
	}

	const contract = getNftContract();

	const res = await contract["ownerOf"](tokenId);

	//console.log("Owner: ", res);

	ownerCache[tokenId] = {
		owner: res,
		timestamp: Date.now()
	}

	return res;
}

export async function getFriend(tokenId: number, friendId: number){

	let friendsList;

	if (
		!friendCache[tokenId] ||
		friendCache[tokenId].timestamp + FRIEND_CACHE_EXPIRY < Date.now() ||
		!friendCache[tokenId].friends.find((friend) => friend.tokenId == friendId)
	){
		friendsList = await getFriendsList(tokenId);
		friendCache[tokenId] = {
			friends: friendsList,
			timestamp: Date.now()
		}
	} else {
		friendsList = friendCache[tokenId].friends;
	}

	const friend = friendsList.find((friend) => friend.tokenId == friendId);

	if (!friend)
		throw new Error("You are not friends with this cat!");

	return friend;
}

export async function getFriendsList(tokenId: number){

	const contract = getSmartCatContract();

	const res = await contract["getFriendsList"](tokenId) as any[];

	const playRequests = convertListResponse(res);

	//console.log("Friends: ", playRequests);

	return playRequests;
}

function convertListResponse(res: any[]): {tokenId: number, owner: string}[] {
	// @ts-ignore
	return Array.from(res).map(([tokenId, tokenUri, owner, level, canPlay]) => {
		return {
			tokenId,
			tokenUri,
			owner,
			level,
			canPlay
		}
	});
}

function getSmartCatContract(){

	// @ts-ignore
	const provider = new ethers.providers.StaticJsonRpcProvider(env.CONTRACT_RPC, "any");

	// TODO: get contract address from engine by origin name.
	return new ethers.Contract(env.SMARTCAT_CONTRACT, [
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
	], provider);
}

function getNftContract(){

	// @ts-ignore
	const provider = new ethers.providers.StaticJsonRpcProvider(env.CONTRACT_RPC, "any");

	// TODO: get contract address from engine by origin name.
	return new ethers.Contract(env.NFT_CONTRACT, [
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "tokenId",
					"type": "uint256"
				}
			],
			"name": "ownerOf",
			"outputs": [
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
	], provider);
}
