import {boolean, index, jsonb, pgTable, serial, timestamp, varchar} from "drizzle-orm/pg-core";
import {InferModel} from "drizzle-orm";

export const messagesTable = pgTable(
    'messages',
    {
        id: serial('id').primaryKey(),
		// contract: varchar('contract', {length: 64}).notNull(),
		sendingAddress: varchar('send_addr', { length: 64 }).notNull(),
		sendingTokenId: varchar('send_token_id', { length: 64 }).notNull(),
		receivingAddress: varchar('receive_addr', { length: 64 }).notNull(),
		receiveTokenId: varchar('receive_token_id', { length: 64 }).notNull(),
        message: varchar('message', { length: 2048 }).notNull(),
		meta: jsonb('meta').notNull(),
		read: boolean('read').notNull().default(false),
        createdAt: timestamp('timestamp').defaultNow(),
    },
    table => {
        return {
            // indexContract: index('index_contract').on(table.contract),
			indexSendingAddress: index('index_send_addr').on(table.sendingAddress),
			indexSendingTokenId: index('index_send_token_id').on(table.sendingTokenId),
			indexReceivingAddress: index('index_receive_addr').on(table.receivingAddress),
			indexReceiveTokenId: index('index_receive_token_id').on(table.receiveTokenId),
        };
    }
);

export type Message = InferModel<typeof messagesTable>;
export type NewMessage = InferModel<typeof messagesTable, "insert">;
