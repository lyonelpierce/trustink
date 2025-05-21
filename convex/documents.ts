import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getDocumentsWithRecipients = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .first();

    if (!user) {
      throw new Error("User not found");
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

// Generate a unique upload URL for a file (Large Size)
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Store a document (Up to 20MB controlled)
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

export const createDocument = mutation({
  args: {
    name: v.string(),
    size: v.number(),
    storage_id: v.string(),
    status: v.string(),
    visibility: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
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

    const url = await ctx.storage.getUrl(args.storage_id as Id<"_storage">);

    const documentId = await ctx.db.insert("documents", {
      name: args.name,
      size: args.size,
      url: url!,
      user_id: user._id,
      storage_id: args.storage_id,
      status: args.status,
      visibility: args.visibility,
      created_at: args.created_at,
      updated_at: args.updated_at,
    });

    return documentId;
  },
});

export const getDocument = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, { documentId }) => {
    const document = await ctx.db.get(documentId);

    if (!document) {
      throw new Error("Document not found");
    }

    return document;
  },
});
