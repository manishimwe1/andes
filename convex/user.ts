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

export const updateUserRole = mutation({
  args: {
    userId: v.id("user"),
    fields: v.object({
      role: v.optional(
        v.union(
          v.literal("accountant"),
          v.literal("admin"),
          v.literal("manager"),
          v.literal("cantine-committee"),
          v.literal("client"),
        ),
      ),
      username: v.optional(v.string()),
      status: v.optional(
        v.union(
          v.literal("pending"),
          v.literal("approved"),
          v.literal("reject"),
        ),
      ), // <-- add this
      // add other fields as needed
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, args.fields);
  },
});
export const createUser = internalMutation({
  args: {
    fullname: v.string(),
    username: v.string(),
    email: v.string(),
    password: v.optional(v.string()),
    transactionPassword: v.optional(v.string()),
    invitationCode: v.optional(v.string()),
    contact: v.optional(v.string()),
    telegram: v.optional(v.string()),
    position: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("accountant"),
        v.literal("admin"),
        v.literal("manager"),
        v.literal("cantine-committee"),
        v.literal("client"),
      ),
    ),
    image: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("approved"), v.literal("reject")),
    ),
  },
  handler: async (ctx, args) => {
    const newUser = await ctx.db.insert("user", {
      fullname: args.fullname,
      username: args.username,
      email: args.email,
      password: args.password,
      transactionPassword: args.transactionPassword,
      invitationCode: args.invitationCode,
      contact: args.contact,
      telegram: args.telegram,
      position: args.position,
      role: args.role,
      image: args.image,
      status: args.status ?? "pending", // <-- Default to "pending"
    });
    if (!newUser)
      return new ConvexError("something went wrong in creating user!");
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
      .filter((q) => q.eq(q.field("email"), args.email))
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
      throw new ConvexError("something went wrong in getting user!");
    }
    return User;
  },
});
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const User = await ctx.db
      .query("user")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!User) {
      throw new ConvexError("something went wrong in getting user!");
    }
    return User;
  },
});

export const updateUserToken = internalMutation({
  args: {
    userId: v.id("user"),
    resetToken: v.optional(v.string()),
    resetTokenExpiry: v.optional(v.number()),
    hashPassword: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      ...(args.resetToken !== undefined && { resetToken: args.resetToken }),
      ...(args.resetTokenExpiry !== undefined && {
        resetTokenExpiry: args.resetTokenExpiry,
      }),
      ...(args.hashPassword !== undefined && {
        password: args.hashPassword,
      }),
    });
  },
});
export const checkUserByEmail = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    try {
      const user: Doc<"user"> = await ctx.runQuery(internal.user.getUser, {
        email: args.email,
      });
      if (!user) {
        return { found: false };
      }
      return { found: true, user: user };
    } catch (error) {
      // Optionally log error somewhere
      return { found: false, error: "Server error" };
    }
  },
});
export const checkUserByContact = action({
  args: { contact: v.string() },
  handler: async (ctx, args) => {
    try {
      const user: Doc<"user"> = await ctx.runQuery(
        internal.user.getUserContact,
        {
          contact: args.contact,
        },
      );
      if (!user) {
        return { found: false };
      }
      return { found: true, user: user };
    } catch (error) {
      // Optionally log error somewhere
      return { found: false, error: "Server error" };
    }
  },
});

export const updateUserInDb = action({
  args: {
    userId: v.id("user"),
    resetToken: v.optional(v.string()),
    resetTokenExpiry: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const user = await ctx.runMutation(internal.user.updateUserToken, {
        userId: args.userId,
        resetToken: args.resetToken,
        resetTokenExpiry: args.resetTokenExpiry,
      });
      if (!user) {
        return { found: false };
      }
      return { found: true };
    } catch (error) {
      // Optionally log error somewhere
      return { found: false, error: "Server error" };
    }
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
export const getUserIndb = query({
  args: {
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const User = await ctx.db
      .query("user")
      .filter((q) => q.eq(q.field("email"), args.email))
      .collect();

    if (!User) {
      throw new ConvexError("something went wrong in creating user!");
    }
    return User[0];
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
    email: v.string(),
    password: v.string(),
    confirmPassword: v.string(),
    transactionPassword: v.string(),
    invitationCode: v.string(),
    telegram: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate passwords match
    if (args.password !== args.confirmPassword) {
      return { success: false, error: "Passwords do not match" };
    }

    const existingUser = await ctx.runQuery(internal.user.getUser, {
      email: args.email,
    });
    if (existingUser) {
      return { success: false, error: "User already exists" };
    }

    // Generate username from email (part before @)
    const username = args.email.split('@')[0].toLowerCase();
    
    // Hash both passwords
    const hashPass = await hash(args.password, 12);
    const hashTransactionPass = await hash(args.transactionPassword, 12);

    const newUser = await ctx.runMutation(internal.user.createUser, {
      fullname: username, // Use username as default fullname
      username: username,
      email: args.email,
      password: hashPass,
      transactionPassword: hashTransactionPass,
      invitationCode: args.invitationCode,
      telegram: args.telegram,
      role: "client", // Default role
      status: "pending", // Default status
    });
    if (!newUser) {
      throw new Error("Failed to create user");
    }
    // console.log("User created successfully");
    return { success: true, error: null };
  },
});

export const searchUsers = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("user").collect();
    if (!args.search) return all;
    const search = args.search.toLowerCase();
    return all.filter(
      (u) =>
        u.fullname?.toLowerCase().includes(search) ||
        u.contact?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search),
    );
  },
});

export const getUserByUsername = internalQuery({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("user")
      .filter((q) => q.eq(q.field("username"), args.username))
      .collect();
    return user[0] || null;
  },
});
export const updateUserEmail = mutation({
  args: { userId: v.id("user"), email: v.string() },
  handler: async (ctx, { userId, email }) => {
    const normalizedEmail = email.toLowerCase();

    try {
      const existingUser = await ctx.db
        .query("user")
        .filter((q) => q.eq(q.field("email"), normalizedEmail))
        .first();

      // Check if email is taken by someone else
      if (existingUser && existingUser._id !== userId) {
        return { success: false, error: "Email already in use by another user"}
      }

      await ctx.db.patch(userId, { email: normalizedEmail });
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

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
