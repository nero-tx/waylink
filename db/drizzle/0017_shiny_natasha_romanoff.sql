CREATE TYPE "public"."support_category" AS ENUM('provider_status', 'account', 'billing', 'listing', 'booking', 'technical', 'other');--> statement-breakpoint
CREATE TYPE "public"."support_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."support_status" AS ENUM('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed');--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"author_id" text,
	"is_staff" boolean DEFAULT false NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" integer GENERATED ALWAYS AS IDENTITY (sequence name "support_tickets_ticket_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"provider_id" uuid,
	"assignee_id" text,
	"category" "support_category" DEFAULT 'other' NOT NULL,
	"subject" text NOT NULL,
	"status" "support_status" DEFAULT 'open' NOT NULL,
	"priority" "support_priority" DEFAULT 'normal' NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assignee_id_user_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "support_message_ticket_idx" ON "support_messages" USING btree ("ticket_id","created_at");--> statement-breakpoint
CREATE INDEX "support_message_author_idx" ON "support_messages" USING btree ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "support_ticket_number_idx" ON "support_tickets" USING btree ("ticket_number");--> statement-breakpoint
CREATE INDEX "support_ticket_user_idx" ON "support_tickets" USING btree ("user_id","last_message_at");--> statement-breakpoint
CREATE INDEX "support_ticket_provider_idx" ON "support_tickets" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "support_ticket_assignee_idx" ON "support_tickets" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "support_ticket_status_idx" ON "support_tickets" USING btree ("status","priority");--> statement-breakpoint
CREATE INDEX "support_ticket_category_idx" ON "support_tickets" USING btree ("category");