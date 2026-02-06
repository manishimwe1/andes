import { hash } from "bcryptjs";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query
} from "./_generated/server";



export const getUserByContact = query({
  args: {
    contact: v.string(),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db
      .query("user")
      .withIndex("by_contact", (q) => q.eq("contact", args.contact))
      .first();

    return client;
  },
});


export const createUser = internalMutation({
  args: {
    countryCode: v.string(),
    password: v.optional(v.string()),
    transactionPassword: v.optional(v.string()),
    invitationCode: v.optional(v.string()),
    contact: v.optional(v.string()),
    telegram: v.optional(v.string()),
    position: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("admin"),
        v.literal("client"),
      ),
    ),
    
  },
  handler: async (ctx, args) => {
    const newUser = await ctx.db.insert("user", {
      countryCode: args.countryCode,
      password: args.password,
      transactionPassword: args.transactionPassword,
      invitationCode: args.invitationCode,
      contact: args.contact,
      telegram: args.telegram,
      position: args.position,
      role: args.role,
    });
    if (!newUser)
      return new ConvexError("something went wrong in creating user!");
    // After creating user, generate a unique invitation code and create invite record
    const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();
    let code = generateCode();
    let tries = 0;
    while (tries < 5) {
      const existing = await ctx.db
        .query("invite")
        .withIndex("by_code", (q: any) => q.eq("code", code))
        .first();
      if (!existing) break;
      code = generateCode();
      tries++;
    }

    try {
      await ctx.db.insert("invite", {
        code,
        issuer: newUser,
        maxUses: 5,
        uses: 0,
        createdAt: Date.now(),
      });
      await ctx.db.patch(newUser, { invitationCode: code });
    } catch (e) {
      // ignore invite creation failures
    }

    return newUser;
  },
});

export const getUser = internalQuery({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const User = await ctx.db
      .query("user")
      .withIndex("by_contact", (q) => q.eq("contact", args.email))
      .collect();

    if (!User) {
      throw new ConvexError("something went wrong in getting user!");
    }
    return User[0];
  },
});

export const getUserContact = internalQuery({
  args: {
    contact: v.string(),
  },
  handler: async (ctx, args) => {
    const User = await ctx.db
      .query("user")
      .filter((q) => q.eq(q.field("contact"), args.contact))
      .first();

    if (!User) {
      return null;
    }
    return User;
  },
});

export const getUserById = query({
  args: {
    userId: v.id("user"),
  },
  handler: async (ctx, args) => {
    const User = await ctx.db.get(args.userId);

    if (!User) {
      throw new ConvexError("something went wrong in creating user!");
    }
    return User;
  },
});

export const getAllUsers = query({
  handler: async (ctx) => {
    const User = await ctx.db.query("user").order("desc").collect();

    if (!User) {
      throw new ConvexError("something went wrong in creating user!");
    }
    return User;
  },
});
export const registerUser = action({
  args: {
    countryCode: v.string(),
    password: v.string(),
    confirmPassword: v.string(),
    transactionPassword: v.string(),
    invitationCode: v.string(),
    telegram: v.string(),
    contact: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate passwords match
    if (args.password !== args.confirmPassword) {
      return { success: false, error: "Passwords do not match" };
    }

    const existingUser = await ctx.runQuery(internal.user.getUserContact, {
      contact: args.contact,
    });
    if (existingUser) {
      return { success: false, error: "User already exists" };
    }

    // Validate invitation code by attempting to claim it
    const claimResult: any = await ctx.runMutation(internal.invite.claimInvite, {
      code: args.invitationCode,
    });
    if (!claimResult || !claimResult.success) {
      return { success: false, error: claimResult?.error || 'Invalid invitation code' };
    }

    
    // Hash both passwords
    const hashPass = await hash(args.password, 12);
    const hashTransactionPass = await hash(args.transactionPassword, 12);

    const newUser = await ctx.runMutation(internal.user.createUser, {
      countryCode: args.countryCode,
      password: hashPass,
      transactionPassword: hashTransactionPass,
      invitationCode: args.invitationCode,
      telegram: args.telegram,
      role: "client", // Default role
      contact: args.contact,
    });
    if (!newUser) {
      throw new Error("Failed to create user");
    }
    
    // console.log("User created successfully");
    return { success: true, error: null };
  },
}) as any;



export const deleteUserInDb = mutation({
  args: {
    userId: v.id("user"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      throw new ConvexError("User not found!");
    }

    await ctx.db.delete(args.userId);
    return { success: true };
  },
});
