import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";

// Create an invite (internal mutation)
export const createInvite = internalMutation({
  args: {
    code: v.string(),
    issuer: v.optional(v.id("user")),
    maxUses: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    meta: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const newInvite = await ctx.db.insert("invite", {
      code: args.code,
      issuer: args.issuer,
      maxUses: args.maxUses ?? 1,
      uses: 0,
      createdAt: now,
      expiresAt: args.expiresAt,
      meta: args.meta,
    });
    return newInvite;
  },
});

export const getInviteByCode = internalQuery({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invite")
      .withIndex("by_code", (q: any) => q.eq("code", args.code))
      .first();
    return invite ?? null;
  },
});

export const claimInvite = internalMutation({
  args: {
    code: v.string(),
    claimedBy: v.optional(v.id("user")),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invite")
      .withIndex("by_code", (q: any) => q.eq("code", args.code))
      .first();
    if (!invite) {
      return { success: false, error: "Invalid invitation code" };
    }
    const now = Date.now();
    if (invite.expiresAt && now > invite.expiresAt) {
      return { success: false, error: "Invitation code expired" };
    }
    const maxUses = invite.maxUses ?? 1;
    const uses = invite.uses ?? 0;
    if (uses >= maxUses) {
      return { success: false, error: "Invitation code already used" };
    }
    // increment uses
    await ctx.db.patch(invite._id, { uses: uses + 1 });
    return { success: true, inviteId: invite._id };
  },
});
