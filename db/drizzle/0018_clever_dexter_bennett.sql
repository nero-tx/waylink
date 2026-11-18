ALTER TABLE "support_tickets" ALTER COLUMN "ticket_number" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "ticket_number" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector(
        'english' ,
        coalesce(category ,'') || '' ||
        coalesce(subject ,'') || '' ||
        coalesce(ticketNumber ,'')
      )) STORED;--> statement-breakpoint
CREATE INDEX "support_ts_vectore_idx" ON "support_tickets" USING gin ("search_vector");