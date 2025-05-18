import { v } from "convex/values";
import { query } from "./_generated/server";

export const getDocumentsWithRecipients = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .first();
    if (!user) {
      return [];
    }

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .collect();

    const documentsWithRecipients = await Promise.all(
      documents.map(async (doc) => {
        const recipients = await ctx.db
          .query("recipients")
          .withIndex("by_document_id", (q) => q.eq("document_id", doc._id))
          .collect();
        return { ...doc, recipients };
      })
    );

    return documentsWithRecipients;
  },
});
