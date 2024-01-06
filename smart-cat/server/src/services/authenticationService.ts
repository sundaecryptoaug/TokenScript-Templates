import {ethers} from "ethers";

interface Session {
	expiry: number,
	ethAddress?: string,
}

const sessions: {[challengeText: string]: Session} = {};

export function getNewChallenge(){

	const randomChallenge = "SmartCatSession-" + ethers.utils.hexlify(ethers.utils.randomBytes(32));

	sessions[randomChallenge] = {
		expiry: Date.now() + 3600000
	}

	cleanupExpiredChallenges();

	return {
		text: randomChallenge,
		expiry: sessions[randomChallenge].expiry
	}
}

async function cleanupExpiredChallenges(){
	for (const challenge in sessions){
		if (sessions[challenge].expiry < Date.now())
			delete sessions[challenge];
	}
}

export function checkIsAuthenticated(authString: string){

	let [challengeText, signature] = authString.split(":");

	if (!sessions[challengeText] || sessions[challengeText].expiry < Date.now())
		throw new Error("Session does not exist or is expired");

	const challenge = sessions[challengeText];

	if (signature.indexOf("0x") === -1)
		signature = "0x" + signature;

	const address = ethers.utils.recoverAddress(ethers.utils.arrayify(ethers.utils.hashMessage(challengeText)), signature);

	//console.log("recovered address: ", address);

	if (challenge.ethAddress){
		if (address !== challenge.ethAddress)
			throw new Error("Session address mismatch")
	} else {
		challenge.ethAddress = address;
	}

	return address;
}
