import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getRecipients = query({
  args: {
    document_id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const recipients = await ctx.db
      .query("recipients")
      .withIndex("by_document_id", (q) => q.eq("document_id", args.document_id))
      .collect();
    return recipients;
  },
});

export const addRecipient = mutation({
  args: {
    document_id: v.id("documents"),
    name: v.string(),
    email: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    // Try to find a user with the given email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    console.log("USER", user);

    const recipient = await ctx.db.insert("recipients", {
      document_id: args.document_id,
      email: args.email,
      color: args.color,
      created_at: Date.now(),
      is_second: false,
      is_read: false,
      user_id: user ? user._id : undefined,
    });
    return recipient;
  },
});

export const deleteRecipient = mutation({
  args: {
    recipient_id: v.id("recipients"),
  },
  handler: async (ctx, args) => {
    // Delete all fields for this recipient
    const fields = await ctx.db
      .query("fields")
      .withIndex("by_recipient_id", (q) =>
        q.eq("recipient_id", args.recipient_id)
      )
      .collect();
    for (const field of fields) {
      await ctx.db.delete(field._id);
    }
    // Delete the recipient
    await ctx.db.delete(args.recipient_id);
    return { success: true };
  },
});

export const getRecipientsWithFields = query({
  args: {
    document_id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    // Get all recipients for the document
    const recipients = await ctx.db
      .query("recipients")
      .withIndex("by_document_id", (q) => q.eq("document_id", args.document_id))
      .collect();

    // For each recipient, get their fields
    const recipientsWithFields = await Promise.all(
      recipients.map(async (recipient) => {
        const fields = await ctx.db
          .query("fields")
          .withIndex("by_recipient_id", (q) =>
            q.eq("recipient_id", recipient._id)
          )
          .collect();
        return { ...recipient, fields };
      })
    );
    return recipientsWithFields;
  },
});
