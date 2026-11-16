CREATE TABLE "provider_status_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"from_status" "provider_status",
	"to_status" "provider_status" NOT NULL,
	"notes" text,
	"suggested_solution" text,
	"actor_id" text,
	"resolved_at" timestamp,
	"resolved_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "provider_status_logs" ADD CONSTRAINT "provider_status_logs_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_status_logs" ADD CONSTRAINT "provider_status_logs_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_status_logs" ADD CONSTRAINT "provider_status_logs_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "provider_status_log_provider_idx" ON "provider_status_logs" USING btree ("provider_id","created_at");--> statement-breakpoint
CREATE INDEX "provider_status_log_to_status_idx" ON "provider_status_logs" USING btree ("to_status");--> statement-breakpoint
CREATE INDEX "provider_status_log_actor_idx" ON "provider_status_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "provider_status_log_resolved_idx" ON "provider_status_logs" USING btree ("resolved_at");