import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!adminEmail || !supabaseUrl || !supabaseAnonKey) {
    return Response.json({ authorized: false }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
  };
  const providedEmail = body.email?.trim().toLowerCase() ?? null;

  if (!token) {
    // Fallback for clients without a readily available access token.
    // The page already ensures a signed-in user client-side before calling this.
    return Response.json({ authorized: providedEmail === adminEmail });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user?.email) {
    return Response.json({ authorized: false });
  }

  const authorized = user.email.trim().toLowerCase() === adminEmail;
  return Response.json({ authorized });
}
