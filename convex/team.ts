import { v } from "convex/values";
import { query } from "./_generated/server";

// Returns team stats for three levels (A,B,C) for a given user
export const getTeamReport = query({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    // Collect all users and transactions (dataset expected to be small)
    const users = await ctx.db.query("user").collect();
    const transactions = await ctx.db.query("transaction").collect();

    // Build map of referredBy -> [userIds]
    const childrenMap: Record<string, string[]> = {};
    for (const u of users) {
      const ref = (u as any).referredBy;
      if (ref) {
        const id = String(ref);
        if (!childrenMap[id]) childrenMap[id] = [];
        childrenMap[id].push(String(u._id));
      }
    }

    const levelA: string[] = childrenMap[String(args.userId)] ?? [];
    const levelB: string[] = [];
    const levelC: string[] = [];

    for (const a of levelA) {
      const bs = childrenMap[a] ?? [];
      for (const b of bs) {
        if (!levelB.includes(b)) levelB.push(b);
      }
    }

    for (const b of levelB) {
      const cs = childrenMap[b] ?? [];
      for (const c of cs) {
        if (!levelC.includes(c)) levelC.push(c);
      }
    }

    const sumDepositsFor = (ids: string[]) => {
      let sum = 0;
      const idSet = new Set(ids.map(String));
      for (const t of transactions) {
        if (t.type === "deposit" && t.status === "completed") {
          const uid = String(t.userId);
          if (idSet.has(uid)) sum += t.amount || 0;
        }
      }
      return sum;
    };

    const memberDepositMap: Record<string, number> = {};
    for (const id of [...levelA, ...levelB, ...levelC]) {
      memberDepositMap[id] = 0;
    }
    for (const t of transactions) {
      if (t.type === "deposit" && t.status === "completed") {
        const uid = String(t.userId);
        if (memberDepositMap.hasOwnProperty(uid)) {
          memberDepositMap[uid] = (memberDepositMap[uid] || 0) + (t.amount || 0);
        }
      }
    }

    const aSum = sumDepositsFor(levelA);
    const bSum = sumDepositsFor(levelB);
    const cSum = sumDepositsFor(levelC);

    const aCount = levelA.length;
    const bCount = levelB.length;
    const cCount = levelC.length;

    // Commission percentages
    const aRate = 0.18;
    const bRate = 0.03;
    const cRate = 0.02;

    return {
      levels: {
        A: {
          count: aCount,
          depositSum: aSum,
          commission: aSum * aRate,
          rate: aRate,
          members: levelA.map((id) => {
            const u = users.find((x) => String(x._id) === String(id));
            return {
              _id: u?._id || id,
              contact: u?.contact || "",
              invitationCode: u?.invitationCode || "",
              depositSum: memberDepositMap[id] || 0,
            };
          }),
        },
        B: {
          count: bCount,
          depositSum: bSum,
          commission: bSum * bRate,
          rate: bRate,
          members: levelB.map((id) => {
            const u = users.find((x) => String(x._id) === String(id));
            return {
              _id: u?._id || id,
              contact: u?.contact || "",
              invitationCode: u?.invitationCode || "",
              depositSum: memberDepositMap[id] || 0,
            };
          }),
        },
        C: {
          count: cCount,
          depositSum: cSum,
          commission: cSum * cRate,
          rate: cRate,
          members: levelC.map((id) => {
            const u = users.find((x) => String(x._id) === String(id));
            return {
              _id: u?._id || id,
              contact: u?.contact || "",
              invitationCode: u?.invitationCode || "",
              depositSum: memberDepositMap[id] || 0,
            };
          }),
        },
      },
      totalMembers: aCount + bCount + cCount,
      totalCommission: aSum * aRate + bSum * bRate + cSum * cRate,
    };
  },
});
