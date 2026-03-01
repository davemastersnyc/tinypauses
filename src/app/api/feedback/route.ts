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

export async function POST(request: Request) {
  try {
    if (!isTrustedOrigin(request)) {
      return Response.json({ ok: false, message: "Forbidden" }, { status: 403 });
    }

    const ip = getClientIp(request);
    const rateLimit = applyRateLimit(`feedback:${ip}`, {
      maxRequests: 5,
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

    const body = (await request.json().catch(() => null)) as
      | { message?: string }
      | null;

    const feedbackTextRaw = body?.message?.trim() || "";
    if (feedbackTextRaw.length > 4000) {
      return Response.json(
        { ok: false, message: "Feedback is too long." },
        { status: 400 },
      );
    }
    const feedbackText = feedbackTextRaw || "(No feedback message provided)";

    const fromEmail = process.env.BREVO_FROM_EMAIL?.trim() || "hello@tinypauses.com";
    const brevoApiKey = requireEnv("BREVO_API_KEY");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    let signedInEmail: string | null = null;
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null;
    if (token && supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      signedInEmail = user?.email?.trim() || null;
    }

    const lines = [
      ...(signedInEmail ? [`Signed-in user: ${signedInEmail}`, ""] : []),
      feedbackText,
    ];

    const textContent = lines.join("\n");
    const htmlContent = lines
      .map((line) =>
        line.length
          ? line.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
          : "&nbsp;",
      )
      .join("<br/>");

    const brevo = new BrevoClient({ apiKey: brevoApiKey });
    await brevo.transactionalEmails.sendTransacEmail({
      sender: { email: fromEmail, name: "Tiny Pauses" },
      to: [{ email: "hello@tinypauses.com" }],
      subject: "Tiny Pauses feedback",
      textContent,
      htmlContent: `<p style="white-space:pre-wrap;font-family:Arial,sans-serif;">${htmlContent}</p>`,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Feedback send error", error);
    return Response.json({ ok: false, message: "Could not send feedback right now." }, { status: 500 });
  }
}
