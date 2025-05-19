import { v } from "convex/values";
import { action, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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

export const storeDocument = action({
  args: {
    file: v.any(), // still required
  },
  handler: async (ctx, args) => {
    const { file } = args;

    if (!file) {
      throw new Error("No file provided");
    }

    if (!(file instanceof ArrayBuffer)) {
      throw new Error("File must be provided as ArrayBuffer");
    }

    // Convert ArrayBuffer to Blob before storing
    const blob = new Blob([file], { type: "application/pdf" }); // Optional: Set MIME type

    const storageId: Id<"_storage"> = await ctx.storage.store(blob);

    return storageId;
  },
});
