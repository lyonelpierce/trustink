import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

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
  },
});
