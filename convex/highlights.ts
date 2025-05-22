import { query, mutation } from "./_generated/server";

import { v } from "convex/values";

export const getHighlights = query({
  args: {
    document_id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const highlights = await ctx.db
      .query("highlights")
      .withIndex("by_document_id", (q) => q.eq("document_id", args.document_id))
      .collect();
    return highlights;
  },
});

export const createHighlight = mutation({
  args: {
    user_id: v.id("users"),
    document_id: v.id("documents"),
    position_x: v.float64(),
    position_y: v.float64(),
    width: v.float64(),
    height: v.float64(),
    page: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const highlightId = await ctx.db.insert("highlights", {
      user_id: args.user_id,
      document_id: args.document_id,
      position_x: args.position_x,
      position_y: args.position_y,
      width: args.width,
      height: args.height,
      page: args.page,
      created_at: now,
    });
    return highlightId;
  },
});
