import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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

export const saveChatMessage = mutation({
  args: {
    document_id: v.id("documents"),
    user_id: v.id("users"),
    role: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      document_id: args.document_id,
      user_id: args.user_id,
      role: args.role,
      content: args.content,
      created_at: now,
    });
    return messageId;
  },
});
