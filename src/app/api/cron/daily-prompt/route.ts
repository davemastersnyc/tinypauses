import { BrevoClient } from "@getbrevo/brevo";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type PromptKind = "pause" | "letting-go" | "reflect" | "kindness";

type PromptRow = {
  id: string;
  kind: PromptKind;
  title: string;
  body: string;
  step: string;
  is_active: boolean;
};

type PromptSendLogRow = {
  prompt_id: string;
};

const DAILY_SEND_TYPE = "daily_email";
const ALLOWED_KINDS: PromptKind[] = ["pause", "letting-go", "reflect", "kindness"];

const KIND_LABELS: Record<PromptKind, string> = {
  pause: "Just a pause",
  "letting-go": "Letting go",
  reflect: "Reflecting on today",
  kindness: "Kindness",
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
  return Boolean(secret && token && token === secret);
}

function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

function buildEmailText(prompt: PromptRow) {
  return `Today's tiny pause ✨

${KIND_LABELS[prompt.kind]}
${prompt.title}

${prompt.body}

Your tiny step: ${prompt.step}

---

Save your moments at tinypauses.com 🌱

To unsubscribe reply STOP or click here:
{{ unsubscribe }}
`;
}

function buildEmailHtml(prompt: PromptRow) {
  const kindName = KIND_LABELS[prompt.kind];
  return `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Today's tiny pause ✨</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f4ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #ece7dc;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:24px 24px 10px;">
                <p style="margin:0 0 14px;text-align:center;">
                  <a href="https://tinypauses.com" style="text-decoration:none;">
                    <img
                      src="https://tinypauses.com/brand/LogoLockUp.png"
                      alt="Tiny Pauses"
                      width="160"
                      style="display:inline-block;max-width:160px;height:auto;border:0;outline:none;text-decoration:none;"
                    />
                  </a>
                </p>
                <h1 style="margin:0 0 14px;font-size:22px;line-height:1.25;color:#0f172a;">Today's tiny pause ✨</h1>
                <p style="margin:0;color:#11756a;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${kindName}</p>
                <h2 style="margin:8px 0 14px;font-size:26px;line-height:1.2;color:#0f172a;">${prompt.title}</h2>
                <p style="margin:0 0 14px;font-size:16px;line-height:1.65;">${prompt.body}</p>
                <p style="margin:0 0 18px;font-size:16px;line-height:1.65;">
                  <strong>Your tiny step:</strong> ${prompt.step}
                </p>
                <p style="margin:0 0 8px;font-size:15px;line-height:1.65;">
                  Save your moments at <a href="https://tinypauses.com" style="color:#0b6f64;text-decoration:underline;">tinypauses.com</a> 🌱
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px 24px;color:#6b7280;font-size:12px;line-height:1.5;text-align:center;">
                <p style="margin:0 0 8px;">
                  <a href="https://tinypauses.com/dashboard" style="color:#0b6f64;text-decoration:underline;">Go to my dashboard</a>
                </p>
                <p style="margin:0;">
                  <a href="{{ unsubscribe }}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function pickPrompt(supabase: SupabaseClient, override: boolean, promptId?: string) {
  if (override && promptId) {
    const { data, error } = await supabase
      .from("prompts")
      .select("id, kind, title, body, step, is_active")
      .eq("id", promptId)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw error;
    return (data as PromptRow | null) ?? null;
  }

  const { data: prompts, error: promptsError } = await supabase
    .from("prompts")
    .select("id, kind, title, body, step, is_active")
    .in("kind", ALLOWED_KINDS)
    .eq("is_active", true);
  if (promptsError) throw promptsError;

  const promptRows = (prompts ?? []) as PromptRow[];
  if (!promptRows.length) return null;

  if (override) {
    return promptRows[Math.floor(Math.random() * promptRows.length)] ?? null;
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: sendLogs, error: sendLogsError } = await supabase
    .from("prompt_send_log")
    .select("prompt_id")
    .eq("send_type", DAILY_SEND_TYPE)
    .gte("sent_at", thirtyDaysAgo);
  if (sendLogsError) throw sendLogsError;

  const recentlySent = new Set((sendLogs as PromptSendLogRow[] | null)?.map((row) => row.prompt_id) ?? []);
  const eligible = promptRows.filter((row) => !recentlySent.has(row.id));
  if (!eligible.length) return null;
  return eligible[Math.floor(Math.random() * eligible.length)] ?? null;
}

async function getListRecipientEmails(brevo: BrevoClient, listId: number) {
  const recipients = new Set<string>();
  let offset = 0;
  const limit = 500;
  while (true) {
    const response = await brevo.contacts.getContactsFromList({ listId, limit, offset });
    const contacts = response.contacts ?? [];
    for (const contact of contacts) {
      if (contact.email && !contact.emailBlacklisted) {
        recipients.add(contact.email.trim().toLowerCase());
      }
    }
    if (contacts.length < limit) break;
    offset += limit;
  }
  return Array.from(recipients);
}

async function runDailyPrompt(request: Request, options: { override: boolean; promptId?: string }) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseServiceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const brevoApiKey = requiredEnv("BREVO_API_KEY");
  const brevoListId = Number(requiredEnv("BREVO_DAILY_LIST_ID"));

  if (!Number.isFinite(brevoListId) || brevoListId <= 0) {
    return Response.json({ ok: false, message: "Invalid Brevo list ID" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const brevo = new BrevoClient({ apiKey: brevoApiKey });

  const prompt = await pickPrompt(supabase, options.override, options.promptId);
  if (!prompt) {
    console.error("No eligible prompt found for daily email");
    return Response.json({ ok: false, message: "No eligible prompt found" }, { status: 500 });
  }

  const recipientEmails = await getListRecipientEmails(brevo, brevoListId);

  let sendError: unknown = null;
  try {
    for (const recipient of recipientEmails) {
      await brevo.transactionalEmails.sendTransacEmail({
        sender: { email: "hello@tinypauses.com", name: "Tiny Pauses" },
        replyTo: { email: "hello@tinypauses.com", name: "Tiny Pauses" },
        subject: "Today's tiny pause ✨",
        textContent: buildEmailText(prompt),
        htmlContent: buildEmailHtml(prompt),
        to: [{ email: recipient }],
      });
    }
  } catch (error) {
    sendError = error;
    console.error("Daily prompt send error", error);
  }

  const { error: logError } = await supabase.from("prompt_send_log").insert({
    prompt_id: prompt.id,
    send_type: DAILY_SEND_TYPE,
  });
  if (logError) {
    console.error("Failed logging daily prompt send", logError);
  }

  if (sendError) {
    return Response.json(
      {
        ok: false,
        promptName: prompt.title,
        recipientCount: recipientEmails.length,
        logged: !logError,
      },
      { status: 500 },
    );
  }

  return Response.json({
    ok: true,
    promptName: prompt.title,
    recipientCount: recipientEmails.length,
    logged: !logError,
  });
}

export async function GET(request: Request) {
  return runDailyPrompt(request, { override: false });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    override?: boolean;
    promptId?: string;
  };
  return runDailyPrompt(request, {
    override: Boolean(body.override),
    promptId: body.promptId?.trim(),
  });
}
