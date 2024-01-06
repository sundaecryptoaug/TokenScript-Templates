import {Action} from "../../_core/type";
import z from "zod";
import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import {checkAuthorisation} from "../hooks/checkAuthorisation";
import {createSelectSchema} from "drizzle-zod";
import {messagesTable, NewMessage} from "../../schemas/messages";
import {getNewChallenge} from "../../services/authenticationService";
import {and, eq, inArray, or, sql} from "drizzle-orm";
import {DbService} from "../../_core/services/dbService";
import {validateFriend} from "../hooks/validateFriend";

const messageSelectSchema = createSelectSchema(messagesTable);

export const getChallenge: Action = {
	path: '/challenge',
	method: 'get',
	options: {
		schema: {
			response: {
				200: z.object({
					text: z.string(),
					expiry: z.number()
				})
			},
		},
	},
	handler: getChallengeHandler
};

async function getChallengeHandler(
	this: FastifyInstance,
	request: FastifyRequest,
	reply: FastifyReply
){
	reply.status(200).send(getNewChallenge());
}

export const getNewMessageCount: Action = {
	path: '/message-count/:tokenId',
	method: 'get',
	options: {
		schema: {
			params: z.object({
				tokenId: z.coerce.number(),
			}),
			response: {
				200: z.object({
					//total: z.number(),
					unread: z.number(),
					senders: z.record(z.object({
						unread: z.number()
					}))
				})
			},
			//security: [{apiKey: []}],
		},
		onRequest: checkAuthorisation
	},
	handler: getNewMessageCountHandler
};

async function getNewMessageCountHandler(
	this: FastifyInstance,
	request: FastifyRequest,
	reply: FastifyReply
){
	const address = request.requestContext.get("ethAddress")!!;
	const dbService = (this.diContainer.resolve("dbService") as DbService).db();
	const params = request.params as { tokenId: number };

	const res = await dbService.select({
		sendingTokenId: messagesTable.sendingTokenId,
		count: sql`COALESCE(sum(CASE WHEN read=false THEN 1 ELSE 0 END),0)`,
		lastMessage: sql`max(messages.timestamp)`
	}).from(messagesTable).where(and(
		eq(messagesTable.receivingAddress, address),
		eq(messagesTable.receiveTokenId, params.tokenId.toString()),
	)).groupBy(messagesTable.sendingTokenId);

	const data: {
		unread: number,
		senders: Record<string, { unread: number }>
	} = {
		unread: 0,
		senders: {}
	};

	for (const row of res){
		const count = parseInt(row.count as string);
		data.senders[row.sendingTokenId as string] = {
			unread: count
		};
		data.unread += count;
	}

	reply.status(200).send(data);
}

export const getMessageHistory: Action = {
	path: '/message-history/:tokenId/:friendId',
	method: 'get',
	options: {
		schema: {
			params: z.object({
				tokenId: z.coerce.number(),
				friendId: z.coerce.number(),
			}),
			response: {
				200: z.array(messageSelectSchema)
			},
			//security: [{apiKey: []}],
		},
		onRequest: checkAuthorisation
	},
	handler: getMessageHistoryHandler
};

async function getMessageHistoryHandler(
	this: FastifyInstance,
	request: FastifyRequest,
	reply: FastifyReply
){
	const address = request.requestContext.get("ethAddress")!!;
	const dbService = (this.diContainer.resolve("dbService") as DbService).db();
	const params = request.params as { tokenId: number, friendId: number };

	const friend = await validateFriend(address, params.tokenId, params.friendId, reply)

	if (friend === false)
		return;

	// When token ownership is transferred, messages sent to the previous owner are hidden
	const res = await dbService.select().from(messagesTable).where(or(
		and(
			eq(messagesTable.receivingAddress, address),
			eq(messagesTable.receiveTokenId, params.tokenId.toString()),
			eq(messagesTable.sendingAddress, friend.owner),
			eq(messagesTable.sendingTokenId, params.friendId.toString()),
		),
		and(
			eq(messagesTable.sendingAddress, address),
			eq(messagesTable.sendingTokenId, params.tokenId.toString()),
			eq(messagesTable.receivingAddress, friend.owner),
			eq(messagesTable.receiveTokenId, params.friendId.toString()),
		)
	)).orderBy(messagesTable.createdAt);

	const readMessageIds = res.filter((row) => {
		return row.receiveTokenId == params.tokenId.toString();
	}).map((row) => row.id);

	if (readMessageIds.length > 0)
		await dbService.update(messagesTable).set({
			read: true
		}).where(and(
			eq(messagesTable.read, false),
			inArray(messagesTable.id, readMessageIds)
		));

	reply.status(200).send(res);
}

export const postSendMessage: Action = {
	path: '/send-message/:tokenId/:friendId',
	method: 'post',
	options: {
		schema: {
			params: z.object({
				tokenId: z.coerce.number(),
				friendId: z.coerce.number(),
			}),
			body: z.object({
				message: z.string().nonempty()
			}),
			response: {
				200: messageSelectSchema
			},
			//security: [{apiKey: []}],
		},
		onRequest: checkAuthorisation
	},
	handler: postSendMessageHandler
};

async function postSendMessageHandler(
	this: FastifyInstance,
	request: FastifyRequest,
	reply: FastifyReply
){
	const address = request.requestContext.get("ethAddress")!!;
	const dbService = (this.diContainer.resolve("dbService") as DbService).db();
	const params = request.params as { tokenId: number, friendId: number };
	const body = request.body as { message: string }

	const friend = await validateFriend(address, params.tokenId, params.friendId, reply)

	if (friend === false)
		return;

	const res = await dbService.insert(messagesTable).values(<NewMessage>{
		sendingAddress: address,
		sendingTokenId: params.tokenId.toString(),
		receivingAddress: friend.owner,
		receiveTokenId: friend.tokenId.toString(),
		message: body.message,
		meta: {}
	}).returning();

	reply.status(200).send(res[0]);
}
