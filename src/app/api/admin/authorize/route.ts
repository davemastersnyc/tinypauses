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

  if (!token) {
    return Response.json({ authorized: false }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user?.email) {
    return Response.json({ authorized: false }, { status: 401 });
  }

  const authorized = user.email.trim().toLowerCase() === adminEmail;
  if (!authorized) {
    return Response.json({ authorized: false }, { status: 401 });
  }
  return Response.json({ authorized: true });
}
