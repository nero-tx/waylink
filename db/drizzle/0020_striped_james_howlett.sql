ALTER TABLE "support_tickets" drop column "search_vector";--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector(
        'english',
        coalesce(category::text, '') || ' ' ||
        coalesce(subject, '') || ' ' ||
        coalesce(ticket_number, '')
      )) STORED;