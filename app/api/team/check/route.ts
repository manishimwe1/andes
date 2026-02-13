import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "http://localhost:3210";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const contact = url.searchParams.get("contact");
    if (!contact) {
      return new Response(JSON.stringify({ error: 'contact query parameter required' }), { status: 400 });
    }

    const convex = new ConvexHttpClient(convexUrl);
    const user: any = await convex.query(api.user.getUserByContact, { contact });
    if (!user) return new Response(JSON.stringify({ error: 'user not found' }), { status: 404 });

    const report: any = await convex.query(api.team.getTeamReport, { userId: user._id });

    // Gather invested members (depositSum > 0)
    const invested: any[] = [];
    for (const lvl of ['A','B','C'] as const) {
      const members = report.levels[lvl].members || [];
      for (const m of members) {
        if ((m.depositSum || 0) > 0) {
          invested.push({ level: lvl, user: m.user, depositSum: m.depositSum });
        }
      }
    }

    return new Response(JSON.stringify({ user, invested, report }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || String(error) }), { status: 500 });
  }
}
