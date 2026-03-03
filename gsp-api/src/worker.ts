/**
 * GSP Investor API — Cloudflare Worker
 * Handles investor lead capture → D1, stats endpoint, CORS for drunks.app
 */

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGIN: string;
}

interface InvestorPayload {
  name: string;
  email: string;
  amount: string;
  tier: string;
  accredited: boolean;
  entity?: string;
  message?: string;
}

const VALID_TIERS = ["EXPLORER", "STRATEGIST", "ARCHITECT"];

function corsHeaders(origin: string, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGIN;
  // Allow both drunks.app and localhost for dev
  const isAllowed =
    origin === allowed ||
    origin === `${allowed}/` ||
    origin === "https://www.drunks.app" ||
    origin.startsWith("http://localhost");

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(data: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

// Simple email validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Rate limiting via D1 — max 3 submissions per email per day
async function isRateLimited(db: D1Database, email: string): Promise<boolean> {
  const result = await db
    .prepare(
      "SELECT COUNT(*) as count FROM investors WHERE email = ? AND created_at > datetime('now', '-1 day')"
    )
    .bind(email)
    .first<{ count: number }>();
  return (result?.count ?? 0) >= 3;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    // Route: POST /api/invest — Capture investor lead
    if (url.pathname === "/api/invest" && request.method === "POST") {
      try {
        const body = (await request.json()) as InvestorPayload;

        // Validate required fields
        if (!body.name || !body.email || !body.amount) {
          return json({ error: "Missing required fields: name, email, amount" }, 400, cors);
        }

        if (!isValidEmail(body.email)) {
          return json({ error: "Invalid email address" }, 400, cors);
        }

        const amount = parseFloat(body.amount);
        if (isNaN(amount) || amount < 1000) {
          return json({ error: "Minimum investment amount is $1,000" }, 400, cors);
        }

        const tier = VALID_TIERS.includes(body.tier) ? body.tier : "STRATEGIST";

        // Rate limit check
        if (await isRateLimited(env.DB, body.email)) {
          return json({ error: "Too many submissions. Please try again later." }, 429, cors);
        }

        // Insert into D1
        const ip = request.headers.get("CF-Connecting-IP") || "unknown";
        const ua = request.headers.get("User-Agent") || "unknown";

        await env.DB
          .prepare(
            `INSERT INTO investors (name, email, amount, tier, accredited, entity, message, ip, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            body.name.trim().slice(0, 200),
            body.email.trim().toLowerCase().slice(0, 200),
            amount,
            tier,
            body.accredited ? 1 : 0,
            (body.entity || "").trim().slice(0, 200),
            (body.message || "").trim().slice(0, 2000),
            ip,
            ua.slice(0, 500)
          )
          .run();

        return json(
          {
            success: true,
            message: "Investment interest recorded. We will contact you within 24 hours.",
            reference: `GSP-${Date.now().toString(36).toUpperCase()}`,
          },
          201,
          cors
        );
      } catch (e) {
        console.error("Invest error:", e);
        return json({ error: "Internal server error" }, 500, cors);
      }
    }

    // Route: GET /api/stats — Public stats
    if (url.pathname === "/api/stats" && request.method === "GET") {
      try {
        const countResult = await env.DB
          .prepare("SELECT COUNT(*) as count FROM investors")
          .first<{ count: number }>();

        const totalResult = await env.DB
          .prepare("SELECT COALESCE(SUM(amount), 0) as total FROM investors")
          .first<{ total: number }>();

        const tierResult = await env.DB
          .prepare(
            "SELECT tier, COUNT(*) as count FROM investors GROUP BY tier ORDER BY count DESC"
          )
          .all();

        return json(
          {
            count: countResult?.count ?? 0,
            total_interest: totalResult?.total ?? 0,
            by_tier: tierResult.results ?? [],
          },
          200,
          { ...cors, "Cache-Control": "public, max-age=60" }
        );
      } catch (e) {
        console.error("Stats error:", e);
        return json({ count: 0, total_interest: 0, by_tier: [] }, 200, cors);
      }
    }

    // Route: GET /api/health
    if (url.pathname === "/api/health") {
      return json({ status: "ok", service: "gsp-api", timestamp: new Date().toISOString() }, 200, cors);
    }

    // 404 for everything else
    return json({ error: "Not found" }, 404, cors);
  },
};
