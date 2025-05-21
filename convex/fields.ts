import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getFields = query({
  args: {
    document_id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const fields = await ctx.db
      .query("fields")
      .withIndex("by_document_id", (q) => q.eq("document_id", args.document_id))
      .collect();
    return fields;
  },
});

export const addField = mutation({
  args: {
    document_id: v.id("documents"),
    page: v.number(),
    position_x: v.float64(),
    position_y: v.float64(),
    width: v.float64(),
    height: v.float64(),
    type: v.string(),
    recipient_id: v.optional(v.id("recipients")),
    secondary_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const now = Date.now();

    console.log("RECIPIENTID", args.recipient_id);

    const fieldId = await ctx.db.insert("fields", {
      user_id: user._id,
      document_id: args.document_id,
      page: args.page,
      position_x: args.position_x,
      position_y: args.position_y,
      width: args.width,
      height: args.height,
      type: args.type,
      recipient_id: args.recipient_id,
      created_at: now,
      updated_at: now,
    });
    return fieldId;
  },
});

export const updateField = mutation({
  args: {
    field_id: v.id("fields"),
    position_x: v.optional(v.float64()),
    position_y: v.optional(v.float64()),
    width: v.optional(v.float64()),
    height: v.optional(v.float64()),
    type: v.optional(v.string()),
    recipient_id: v.optional(v.id("recipients")),
    secondary_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();
    if (!user) throw new Error("User not found");
    const field = await ctx.db.get(args.field_id);
    if (!field) throw new Error("Field not found");
    if (field.user_id !== user._id) throw new Error("Unauthorized");
    await ctx.db.patch(args.field_id, {
      ...(args.position_x !== undefined && { position_x: args.position_x }),
      ...(args.position_y !== undefined && { position_y: args.position_y }),
      ...(args.width !== undefined && { width: args.width }),
      ...(args.height !== undefined && { height: args.height }),
      ...(args.type !== undefined && { type: args.type }),
      ...(args.recipient_id !== undefined && {
        recipient_id: args.recipient_id,
      }),
      ...(args.secondary_id !== undefined && {
        secondary_id: args.secondary_id,
      }),
      updated_at: Date.now(),
    });
    return { success: true };
  },
});

export const removeField = mutation({
  args: {
    field_id: v.id("fields"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();
    if (!user) throw new Error("User not found");
    const field = await ctx.db.get(args.field_id);
    if (!field) throw new Error("Field not found");
    if (field.user_id !== user._id) throw new Error("Unauthorized");
    await ctx.db.delete(args.field_id);
    return { success: true };
  },
});
