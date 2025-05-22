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

export const getDocumentWithRecipients = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, { documentId }) => {
    const document = await ctx.db.get(documentId);

    if (!document) {
      throw new Error("Document not found");
    }

    const recipients = await ctx.db
      .query("recipients")
      .withIndex("by_document_id", (q) => q.eq("document_id", documentId))
      .collect();

    return { ...document, recipients };
  },
});

export const updateDocumentName = mutation({
  args: {
    documentId: v.id("documents"),
    name: v.string(),
  },
  handler: async (ctx, { documentId, name }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }
    const document = await ctx.db.get(documentId);
    if (!document) {
      throw new Error("Document not found");
    }
    // Optionally, check if the user is the owner
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();
    if (!user || document.user_id !== user._id) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(documentId, {
      name,
      updated_at: Date.now(),
    });
    return { success: true };
  },
});

export const deleteDocument = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, { documentId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }
    const document = await ctx.db.get(documentId);
    if (!document) {
      throw new Error("Document not found");
    }
    // Optionally, check if the user is the owner
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();
    if (!user || document.user_id !== user._id) {
      throw new Error("Unauthorized");
    }
    // Delete related fields
    const fields = await ctx.db
      .query("fields")
      .withIndex("by_document_id", (q) => q.eq("document_id", documentId))
      .collect();
    for (const field of fields) {
      await ctx.db.delete(field._id);
    }
    // Delete related lines
    const lines = await ctx.db
      .query("lines")
      .withIndex("by_document_id", (q) => q.eq("document_id", documentId))
      .collect();
    for (const line of lines) {
      await ctx.db.delete(line._id);
    }
    // Delete related recipients
    const recipients = await ctx.db
      .query("recipients")
      .withIndex("by_document_id", (q) => q.eq("document_id", documentId))
      .collect();
    for (const recipient of recipients) {
      await ctx.db.delete(recipient._id);
    }
    // Delete related highlights
    // const highlights = await ctx.db
    //   .query("highlights")
    //   .filter((q) => q.eq("document_id", documentId))
    //   .collect();
    // for (const highlight of highlights) {
    //   await ctx.db.delete(highlight._id);
    // }
    // // Delete related messages
    // const messages = await ctx.db
    //   .query("messages")
    //   .filter((q) => q.eq("document_id", documentId))
    //   .collect();
    // for (const message of messages) {
    //   await ctx.db.delete(message._id);
    // }
    // Delete the document itself
    await ctx.storage.delete(document.storage_id as Id<"_storage">);

    await ctx.db.delete(documentId);
    return { success: true };
  },
});

export const updateDocumentStatus = mutation({
  args: {
    document_id: v.id("documents"),
    status: v.string(),
  },
  handler: async (ctx, { document_id, status }) => {
    const document = await ctx.db.get(document_id);
    if (!document) {
      throw new Error("Document not found");
    }
    await ctx.db.patch(document_id, {
      status,
    });
    return { success: true };
  },
});
