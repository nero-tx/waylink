DROP INDEX "wishlist_user_name_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "wishlist_item_unique_idx" ON "wishlist_items" USING btree ("wishlist_id","item_id");