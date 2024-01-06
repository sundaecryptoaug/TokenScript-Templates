CREATE TABLE IF NOT EXISTS "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"send_addr" varchar(64) NOT NULL,
	"send_token_id" varchar(64) NOT NULL,
	"receive_addr" varchar(64) NOT NULL,
	"receive_token_id" varchar(64) NOT NULL,
	"message" varchar(2048) NOT NULL,
	"meta" jsonb NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "index_send_addr" ON "messages" ("send_addr");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "index_send_token_id" ON "messages" ("send_token_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "index_receive_addr" ON "messages" ("receive_addr");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "index_receive_token_id" ON "messages" ("receive_token_id");