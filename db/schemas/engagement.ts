import {
  pgTable,
  uuid,
  text,
  index,
  timestamp,
  boolean,
  uniqueIndex,
  integer,
} from "drizzle-orm/pg-core";
import { user } from "./public";
import { products } from "./product";
import {
  notificationTypeEnum,
  recipientTypeEnum,
  supportCategoryEnum,
  supportPriorityEnum,
  supportStatusEnum,
  timestamps,
} from "./enums";
import { providers } from "./provider";

export const wishlists = pgTable(
  "wishlists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("My Wishlist"),
    description: text("description"),
    isPrivate: boolean("is_private").notNull().default(false),
    color: text("color").default("#e8734a"),
    ...timestamps,
  },
  (t) => [index("wishlist_user_idx").on(t.userId)],
);

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    wishlistId: uuid("wishlist_id")
      .notNull()
      .references(() => wishlists.id, { onDelete: "cascade" }),
    itemType: text("item_type")
      .$type<"experience" | "transport" | "accommodation">()
      .notNull(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("wishlist_item_wishlist_idx").on(t.wishlistId),
    index("wishlist_item_item_idx").on(t.itemType, t.itemId),
    // prevent duplicated items
    uniqueIndex("wishlist_item_unique_idx").on(t.wishlistId, t.itemId),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientType: recipientTypeEnum("recipient_type").notNull(),
    recipientId: text("recipient_id").notNull(),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at"),
    ...timestamps,
  },
  (t) => [
    index("notification_recipient_idx").on(t.recipientType, t.recipientId),
    index("notification_read_idx").on(t.isRead),
    index("notification_created_idx").on(t.createdAt),
  ],
);

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Human-friendly number shown to users, e.g. #1042
    ticketNumber: integer("ticket_number").generatedAlwaysAsIdentity(),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Set when the ticket is about a provider account (e.g. a status issue)
    providerId: uuid("provider_id").references(() => providers.id, {
      onDelete: "set null",
    }),
    // Staff member handling the ticket
    assigneeId: text("assignee_id").references(() => user.id, {
      onDelete: "set null",
    }),

    category: supportCategoryEnum("category").notNull().default("other"),
    subject: text("subject").notNull(),
    status: supportStatusEnum("status").notNull().default("open"),
    priority: supportPriorityEnum("priority").notNull().default("normal"),

    lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
    closedAt: timestamp("closed_at"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("support_ticket_number_idx").on(t.ticketNumber),
    index("support_ticket_user_idx").on(t.userId, t.lastMessageAt),
    index("support_ticket_provider_idx").on(t.providerId),
    index("support_ticket_assignee_idx").on(t.assigneeId),
    index("support_ticket_status_idx").on(t.status, t.priority),
    index("support_ticket_category_idx").on(t.category),
  ],
);

export const supportMessages = pgTable(
  "support_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => supportTickets.id, { onDelete: "cascade" }),
    // Kept as null if the author's account is deleted
    authorId: text("author_id").references(() => user.id, {
      onDelete: "set null",
    }),
    isStaff: boolean("is_staff").notNull().default(false),
    // Internal notes are only visible to staff, never to the customer
    isInternal: boolean("is_internal").notNull().default(false),
    body: text("body").notNull(),
    ...timestamps,
  },
  (t) => [
    index("support_message_ticket_idx").on(t.ticketId, t.createdAt),
    index("support_message_author_idx").on(t.authorId),
  ],
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
