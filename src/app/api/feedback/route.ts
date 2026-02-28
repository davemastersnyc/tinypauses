import { BrevoClient } from "@getbrevo/brevo";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { message?: string; userEmail?: string | null }
      | null;

    const feedbackText = body?.message?.trim() || "(No feedback message provided)";
    const userEmail = body?.userEmail?.trim();
    const fromEmail = process.env.BREVO_FROM_EMAIL?.trim() || "hello@tinypauses.com";
    const brevoApiKey = requireEnv("BREVO_API_KEY");

    const lines = [
      ...(userEmail ? [`Signed-in user: ${userEmail}`, ""] : []),
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
