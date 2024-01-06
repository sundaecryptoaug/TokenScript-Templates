import {FastifyReply, FastifyRequest} from "fastify";
import {checkIsAuthenticated} from "../../services/authenticationService";

export const checkAuthorisation = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const authHeader = request.headers["x-smartcat-auth"];

		if (!authHeader)
			throw new Error("Authorization header not provided");

		const ethAddress = checkIsAuthenticated(authHeader as string);
		request.requestContext.set("ethAddress", ethAddress);

		return true;
	} catch (err: any) {
		err.statusCode = 403;
		throw err;
	}
}
