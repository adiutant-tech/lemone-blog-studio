// Cloudflare Worker â€” proxy do Anthropic API

const ALLOWED_ORIGINS = [
  "https://adiutant-tech.github.io",
  "http://localhost:5173",
  "http://localhost:4173"
];

const ANTHROPIC_VERSION = "2023-06-01";
const UPSTREAM = "https://api.anthropic.com/v1/messages";

const RATE_BUCKET = new Map();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip) {
  const now = Date.now();
  const bucket = RATE_BUCKET.get(ip) || { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_WINDOW_MS;
  }
  bucket.count++;
  RATE_BUCKET.set(ip, bucket);
  return bucket.count <= RATE_LIMIT;
}

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Use POST" }), {
        status: 405,
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return new Response(JSON.stringify({ error: "Origin not allowed" }), {
        status: 403,
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ error: "Rate limit: 60 req/min per IP" }), {
        status: 429,
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    const safeBody = {
      model: body.model || "claude-sonnet-4-20250514",
      max_tokens: Math.min(body.max_tokens || 1000, 2000),
      messages: body.messages
    };

    if (!Array.isArray(safeBody.messages) || safeBody.messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(safeBody)
    });

    const text = await upstream.text();

    return new Response(text, {
      status: upstream.status,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
};
