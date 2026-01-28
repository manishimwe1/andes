import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  
  // 👤 Users
  user: defineTable({
    fullname: v.string(),
    username: v.string(),
    email: v.string(),
    password: v.optional(v.string()),
    transactionPassword: v.optional(v.string()),
    invitationCode: v.optional(v.string()),
    contact: v.optional(v.string()),
    telegram: v.optional(v.string()),
    position: v.optional(v.string()),
    image: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("accountant"),
        v.literal("admin"),
        v.literal("manager"),
        v.literal("cantine-committee"),
        v.literal("client"),
      ),
    ),
    resetToken: v.optional(v.string()),
    resetTokenExpiry: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("approved"), v.literal("reject")),
    ),
  }).index("by_contact", ["contact"]).index('by_email',['email']),
});
