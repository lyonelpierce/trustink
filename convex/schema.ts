import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

export const User = {
  email: v.string(),
  user_id: v.string(),
  first_name: v.string(),
  last_name: v.string(),
  image_url: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const Signatures = {
  user_id: v.id("users"),
  full_name: v.string(),
  initials: v.string(),
  font: v.string(),
  created_at: v.number(),
  updated_at: v.number(),
};

export const Document = {
  name: v.string(),
  size: v.string(),
  user_id: v.id("users"),
  path: v.string(),
  status: v.string(),
  visibility: v.boolean(),
  created_at: v.number(),
  updated_at: v.number(),
};

export const Lines = {
  user_id: v.id("users"),
  document_id: v.id("documents"),
  page_number: v.number(),
  created_at: v.number(),
  updated_at: v.number(),
  bbox: v.array(v.number()),
  position_x: v.float64(),
  position_y: v.float64(),
  width: v.float64(),
  height: v.float64(),
  font: v.string(),
  size: v.number(),
  color: v.string(),
  text: v.string(),
  style: v.optional(v.string()),
};

export const Fields = {
  document_id: v.id("documents"),
  user_id: v.id("users"),
  recipient_id: v.optional(v.id("recipients")),
  secondary_id: v.optional(v.string()),
  page: v.number(),
  position_x: v.float64(),
  position_y: v.float64(),
  width: v.float64(),
  height: v.float64(),
  type: v.string(),
  created_at: v.number(),
  updated_at: v.number(),
};

export const Highlights = {
  user_id: v.id("users"),
  document_id: v.id("documents"),
  position_x: v.float64(),
  position_y: v.float64(),
  width: v.float64(),
  height: v.float64(),
  page: v.number(),
  created_at: v.number(),
};

export const Recipients = {
  document_id: v.id("documents"),
  user_id: v.optional(v.id("users")),
  email: v.string(),
  color: v.optional(v.string()),
  is_second: v.boolean(),
  is_read: v.boolean(),
  signature_id: v.optional(v.id("signatures")),
  signed_at: v.optional(v.number()),
  deleted_at: v.optional(v.number()),
  created_at: v.number(),
  signer_id: v.optional(v.string()),
};

export const Messages = {
  document_id: v.id("documents"),
  user_id: v.id("users"),
  content: v.string(),
  role: v.string(),
  created_at: v.number(),
};

export default defineSchema({
  users: defineTable(User).index("by_user_id", ["user_id"]),
  signatures: defineTable(Signatures),
  documents: defineTable(Document).index("by_user_id", ["user_id"]),
  lines: defineTable(Lines),
  fields: defineTable(Fields),
  highlights: defineTable(Highlights),
  recipients: defineTable(Recipients).index("by_document_id", ["document_id"]),
  messages: defineTable(Messages),
});
