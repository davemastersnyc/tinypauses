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

const WELCOME_EMAIL_HTML = `
<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your first tiny pause is inside.</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f4ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #ece7dc;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 8px;">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Hey, welcome.</p>
                <p style="margin:0 0 22px;font-size:16px;line-height:1.6;">Here&apos;s your first tiny pause -- no waiting required.</p>

                <div style="border:1px solid #ece7dc;border-radius:14px;background:#fffdf8;padding:18px;">
                  <p style="margin:0;color:#11756a;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Just a pause</p>
                  <h2 style="margin:8px 0 12px;font-size:24px;line-height:1.2;color:#0f172a;">Color Count</h2>
                  <p style="margin:0 0 12px;font-size:16px;line-height:1.65;">
                    Pick one color and count how many things you can find in that color nearby.
                  </p>
                  <p style="margin:0;font-size:16px;line-height:1.65;">
                    <strong>Your tiny step:</strong> After counting, close your eyes for one breath and open slowly.
                  </p>
                </div>

                <p style="margin:20px 0 0;font-size:16px;line-height:1.65;">Tomorrow morning we&apos;ll send another one.</p>
                <p style="margin:14px 0 0;font-size:16px;line-height:1.65;">
                  If you want to save your moments and see them grow over time, you can create a free account at
                  <a href="https://tinypauses.com" style="color:#0b6f64;text-decoration:underline;">tinypauses.com</a>.
                </p>
                <p style="margin:20px 0 0;font-size:16px;line-height:1.65;">Talk soon.<br/>Tiny Pauses</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 24px;color:#6b7280;font-size:12px;line-height:1.5;">
                Unsubscribe: [unsubscribe link]
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
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
      htmlContent: WELCOME_EMAIL_HTML,
      textContent: WELCOME_EMAIL_TEXT,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Daily subscription error", error);
    return Response.json({ ok: false, message: "Could not subscribe right now." }, { status: 500 });
  }
}
