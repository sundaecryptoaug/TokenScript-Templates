import {getFriend, getTokenOwner} from "../../services/contractService";
import {FastifyReply, FastifyRequest} from "fastify";

export const validateFriend = async (ethAddress: string, tokenId: number, friendId: number, reply: FastifyReply) => {

	const tokenOwner = await getTokenOwner(tokenId);

	if (tokenOwner !== ethAddress) {
		reply.status(403).send({
			message: "You don't own this cat!"
		})
		return false;
	}

	const friend = await getFriend(tokenId, friendId);

	if (!friend) {
		reply.status(403).send({
			message: "Your cat is not friends with this cat!"
		});
		return false;
	}

	return <{tokenId: number, owner: string}>friend;
};
