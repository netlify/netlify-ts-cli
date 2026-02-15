import { createServerFn } from "@tanstack/react-start";
import { db, schema } from "@/db";
import { desc } from "drizzle-orm";

export const getEntries = createServerFn({ method: "GET" }).handler(
  async () => {
    const entries = await db
      .select()
      .from(schema.guestbook)
      .orderBy(desc(schema.guestbook.createdAt));
    return entries;
  }
);

export const addEntry = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; message: string }) => data)
  .handler(async ({ data }) => {
    const result = await db
      .insert(schema.guestbook)
      .values({ name: data.name, message: data.message })
      .returning();
    return result[0];
  });
