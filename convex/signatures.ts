import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a signature
export const createSignature = mutation({
  args: {
    full_name: v.string(),
    font: v.string(),
  },
  handler: async (ctx, { full_name, font }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // Check for duplicate
    const existing = await ctx.db
      .query("signatures")
      .filter(
        (q) =>
          q.eq("user_id", user._id.toString()) && q.eq("full_name", full_name)
      )
      .first();
    if (existing) throw new Error("A similar signature already exists");

    const initials = full_name
      .split(" ")
      .map((name) => name[0])
      .join("");

    await ctx.db.insert("signatures", {
      user_id: user._id,
      full_name,
      initials,
      font,
      created_at: Date.now(),
      updated_at: Date.now(),
    });
    return { message: "Signature created successfully" };
  },
});

// Update a signature
export const updateSignature = mutation({
  args: {
    id: v.id("signatures"),
    full_name: v.string(),
    font: v.string(),
  },
  handler: async (ctx, { id, full_name, font }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const signature = await ctx.db.get(id);
    if (!signature) throw new Error("Signature not found");

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();
    if (!user || signature.user_id !== user._id)
      throw new Error("Unauthorized");

    const initials = full_name
      .split(" ")
      .map((name) => name[0])
      .join("");

    await ctx.db.patch(id, {
      full_name,
      initials,
      font,
      updated_at: Date.now(),
    });
    return { message: "Signature updated successfully" };
  },
});

// Delete a signature
export const deleteSignature = mutation({
  args: {
    id: v.id("signatures"),
  },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const signature = await ctx.db.get(id);
    if (!signature) throw new Error("Signature not found");

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();
    if (!user || signature.user_id !== user._id)
      throw new Error("Unauthorized");

    await ctx.db.delete(id);
    return { message: "Signature deleted successfully" };
  },
});

// Get all signatures for the authenticated user
export const getUserSignatures = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // Get all signatures for this user
    const signatures = await ctx.db
      .query("signatures")
      .filter((q) => q.eq("user_id", user._id.toString()))
      .collect();
    return signatures;
  },
});
