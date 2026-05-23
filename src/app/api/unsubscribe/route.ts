import { BrevoClient } from "@getbrevo/brevo";
import { createClient } from "@supabase/supabase-js";
import { applyRateLimit, getClientIp, isTrustedOrigin } from "@/lib/apiSecurity";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization");
  return authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
}

export async function POST(request: Request) {
  try {
    if (!isTrustedOrigin(request)) {
      return Response.json({ ok: false, message: "Forbidden" }, { status: 403 });
    }

    const ip = getClientIp(request);
    const rateLimit = applyRateLimit(`unsubscribe:${ip}`, {
      maxRequests: 8,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return Response.json(
        { ok: false, message: "Too many requests. Please try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const token = getBearerToken(request);
    if (!token) {
      return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const brevoApiKey = requireEnv("BREVO_API_KEY");
    const brevoListId = Number(requireEnv("BREVO_DAILY_LIST_ID"));

    if (!Number.isFinite(brevoListId) || brevoListId <= 0) {
      return Response.json({ ok: false, message: "Invalid Brevo list ID." }, { status: 500 });
    }

    // Only let a signed-in user unsubscribe their own address.
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(token);

    const email = user?.email?.trim().toLowerCase();
    if (authError || !email) {
      return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const brevo = new BrevoClient({ apiKey: brevoApiKey });
    await brevo.contacts.removeContactFromList({
      listId: brevoListId,
      body: { emails: [email] },
    });

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await supabase
      .from("daily_subscribers")
      .update({ is_active: false })
      .eq("email", email);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Unsubscribe error", error);
    return Response.json(
      { ok: false, message: "Could not unsubscribe right now." },
      { status: 500 },
    );
  }
}
