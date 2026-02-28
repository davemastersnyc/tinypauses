import { BrevoClient } from "@getbrevo/brevo";
import { createClient } from "@supabase/supabase-js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const WELCOME_EMAIL_TEXT = `Hey, welcome.

Here's your first tiny pause -- no waiting required.

---

Just a pause
Color Count

Pick one color and count how many things
you can find in that color nearby.

Your tiny step: After counting, close your
eyes for one breath and open slowly.

---

Tomorrow morning we'll send another one.

If you want to save your moments and see
them grow over time, you can create a free
account at tinypauses.com.

Talk soon.
Tiny Pauses

Unsubscribe: [unsubscribe link]
`;

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { email?: string } | null;
    const email = body?.email?.trim().toLowerCase() ?? "";

    if (!EMAIL_PATTERN.test(email)) {
      return Response.json({ ok: false, message: "Invalid email address." }, { status: 400 });
    }

    const brevoApiKey = requireEnv("BREVO_API_KEY");
    const brevoListId = Number(requireEnv("BREVO_DAILY_LIST_ID"));
    const brevoFromEmail = process.env.BREVO_FROM_EMAIL?.trim() || "hello@tinypauses.com";
    const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

    if (!Number.isFinite(brevoListId) || brevoListId <= 0) {
      return Response.json({ ok: false, message: "Invalid Brevo list ID." }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error: dbError } = await supabase.from("daily_subscribers").upsert(
      {
        email,
        is_active: true,
        subscribed_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );
    if (dbError) {
      throw dbError;
    }

    const brevo = new BrevoClient({ apiKey: brevoApiKey });
    await brevo.contacts.createContact({
      email,
      listIds: [brevoListId],
      updateEnabled: true,
    });

    await brevo.transactionalEmails.sendTransacEmail({
      sender: { email: brevoFromEmail, name: "Tiny Pauses" },
      to: [{ email }],
      subject: "Your first tiny pause is inside.",
      textContent: WELCOME_EMAIL_TEXT,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Daily subscription error", error);
    return Response.json({ ok: false, message: "Could not subscribe right now." }, { status: 500 });
  }
}
