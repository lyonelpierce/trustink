export const revalidate = 0;

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const add = mutation({
  args: {
    document_id: v.id("documents"),
    page_number: v.number(),
    bbox: v.array(v.number()),
    position_x: v.float64(),
    position_y: v.float64(),
    width: v.float64(),
    height: v.float64(),
    font: v.string(),
    size: v.number(),
    color: v.number(),
    text: v.string(),
    style: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const lineId = await ctx.db.insert("lines", {
      user_id: user._id,
      document_id: args.document_id,
      page_number: args.page_number,
      bbox: args.bbox,
      position_x: args.position_x,
      position_y: args.position_y,
      width: args.width,
      height: args.height,
      font: args.font,
      size: args.size,
      color: args.color,
      text: args.text,
      style: args.style,
      created_at: now,
      updated_at: now,
    });
    return lineId;
  },
});

export const getLines = query({
  args: {
    document_id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    console.log(args.document_id);

    const lines = await ctx.db
      .query("lines")
      .withIndex("by_document_id", (q) => q.eq("document_id", args.document_id))
      .collect();

    console.log(lines);

    return lines;
  },
});

export const removeLine = mutation({
  args: {
    line_id: v.id("lines"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();
    if (!user) {
      throw new Error("User not found");
    }
    const line = await ctx.db.get(args.line_id);
    if (!line) {
      throw new Error("Line not found");
    }
    if (line.user_id !== user._id) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete(args.line_id);
    return { success: true };
  },
});

export const moveLine = mutation({
  args: {
    line_id: v.id("lines"),
    position_x: v.float64(),
    position_y: v.float64(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();
    if (!user) {
      throw new Error("User not found");
    }
    const line = await ctx.db.get(args.line_id);
    if (!line) {
      throw new Error("Line not found");
    }
    if (line.user_id !== user._id) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.line_id, {
      position_x: args.position_x,
      position_y: args.position_y,
      updated_at: Date.now(),
    });
    return { success: true };
  },
});

export const updateLine = mutation({
  args: {
    line_id: v.id("lines"),
    text: v.optional(v.string()),
    height: v.optional(v.float64()),
    width: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();
    if (!user) throw new Error("User not found");
    const line = await ctx.db.get(args.line_id);
    if (!line) throw new Error("Line not found");
    if (line.user_id !== user._id) throw new Error("Unauthorized");
    await ctx.db.patch(args.line_id, {
      ...(args.text !== undefined && { text: args.text }),
      ...(args.height !== undefined && { height: args.height }),
      ...(args.width !== undefined && { width: args.width }),
      updated_at: Date.now(),
    });
    return { success: true };
  },
});
