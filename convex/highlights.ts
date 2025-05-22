import { query } from "./_generated/server";

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
