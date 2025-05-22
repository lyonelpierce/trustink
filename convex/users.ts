import { v } from "convex/values";
import { internalMutation, query, mutation } from "./_generated/server";

export const createUser = internalMutation({
  args: {
    email: v.string(),
    user_id: v.string(),
    first_name: v.string(),
    last_name: v.string(),
    image_url: v.string(),
  },
  handler: async (
    ctx,
    { email, first_name, user_id, last_name, image_url }
  ) => {
    await ctx.db.insert("users", {
      email,
      user_id: user_id,
      first_name,
      last_name,
      image_url,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      success: true,
    };
  },
});

export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", clerkId))
      .first();
  },
});

export const updateUserProfile = mutation({
  args: {
    clerkId: v.string(),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    image_url: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, first_name, last_name, image_url }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", clerkId))
      .first();
    if (!user) {
      throw new Error("User not found");
    }
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (first_name !== undefined) patch.first_name = first_name;
    if (last_name !== undefined) patch.last_name = last_name;
    if (image_url !== undefined) patch.image_url = image_url;
    await ctx.db.patch(user._id, patch);
    return { success: true };
  },
});
