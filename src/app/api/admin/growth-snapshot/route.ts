import { createClient } from "@supabase/supabase-js";

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization");
  return authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
}

export async function GET(request: Request) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const token = getBearerToken(request);

    if (!adminEmail || !supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return Response.json({ ok: false, message: "Missing environment configuration." }, { status: 500 });
    }

    if (!token) {
      return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(token);

    if (authError || !user?.email || user.email.trim().toLowerCase() !== adminEmail) {
      return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: signups24h, error: signups24hError },
      { count: signups7d, error: signups7dError },
      { count: pauses24h, error: pauses24hError },
      { count: pauses7d, error: pauses7dError },
      { count: totalSignups, error: totalSignupsError },
      { count: totalPauses, error: totalPausesError },
    ] = await Promise.all([
      serviceClient
        .from("daily_subscribers")
        .select("*", { count: "exact", head: true })
        .gte("subscribed_at", since24h),
      serviceClient
        .from("daily_subscribers")
        .select("*", { count: "exact", head: true })
        .gte("subscribed_at", since7d),
      serviceClient
        .from("moments")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since24h),
      serviceClient
        .from("moments")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since7d),
      serviceClient.from("daily_subscribers").select("*", { count: "exact", head: true }),
      serviceClient.from("moments").select("*", { count: "exact", head: true }),
    ]);

    const firstError =
      signups24hError ||
      signups7dError ||
      pauses24hError ||
      pauses7dError ||
      totalSignupsError ||
      totalPausesError;

    if (firstError) {
      throw firstError;
    }

    return Response.json({
      ok: true,
      metrics: {
        signups24h: signups24h ?? 0,
        signups7d: signups7d ?? 0,
        pauses24h: pauses24h ?? 0,
        pauses7d: pauses7d ?? 0,
        totalSignups: totalSignups ?? 0,
        totalPauses: totalPauses ?? 0,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load growth snapshot.";
    return Response.json({ ok: false, message }, { status: 500 });
  }
}
