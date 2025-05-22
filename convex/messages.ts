import { v } from "convex/values";
import { query } from "./_generated/server";

export const getChatMessages = query({
  args: {
    document_id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_document_id", (q) => q.eq("document_id", args.document_id))
      .collect();
    return messages;
  },
});
