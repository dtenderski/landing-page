CREATE TABLE "agent_collaborators" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" integer NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'viewer' NOT NULL,
	"invited_by" varchar(255) DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blueprints" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) DEFAULT '' NOT NULL,
	"name" text DEFAULT 'Blueprint Tanpa Judul' NOT NULL,
	"intent" text DEFAULT '',
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pending_agent_invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'viewer' NOT NULL,
	"invited_by" varchar(255) DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_products" ADD COLUMN "is_gustafta" boolean DEFAULT false;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_collaborators_agent_user_unique" ON "agent_collaborators" USING btree ("agent_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pending_agent_invites_agent_email_unique" ON "pending_agent_invites" USING btree ("agent_id","email");