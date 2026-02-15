import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const guestbook = pgTable("guestbook", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
