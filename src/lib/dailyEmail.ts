// Pure send logic for the daily prompt email, kept free of Brevo/Supabase/Next
// imports so it can be unit tested with a fake sender (no network, no real
// emails). The route handler builds the email and supplies a real Brevo client.
//
// The critical invariant this module guarantees: every message targets exactly
// ONE recipient. Addresses are never batched into a shared `to` array, so one
// subscriber can never see another's email. There was a past incident where a
// send put every address in one email; sendDailyPromptToRecipients makes that
// physically impossible, and dailyEmail.test.ts pins it so a refactor cannot
// silently reintroduce it.

export type DailyPromptEmail = {
  sender: { email: string; name: string };
  replyTo: { email: string; name: string };
  subject: string;
  textContent: string;
  htmlContent: string;
};

// Minimal structural shape of the Brevo transactional send we depend on. The
// real `brevo.transactionalEmails` satisfies this; the test passes a fake.
export type TransactionalSender = {
  sendTransacEmail: (payload: DailyPromptEmail & {
    to: Array<{ email: string }>;
  }) => Promise<unknown>;
};

export type DailySendResult = {
  attempted: number;
  sent: number;
  failedRecipients: string[];
};

// Sends the prompt to each recipient as a separate single-recipient message.
// Individual failures are collected and do NOT abort the rest of the run, so
// one bad address cannot deprive the whole list. The caller decides what to do
// with partial vs. total failure (e.g. whether to log the prompt as sent).
export async function sendDailyPromptToRecipients(
  sender: TransactionalSender,
  email: DailyPromptEmail,
  recipientEmails: string[],
): Promise<DailySendResult> {
  let sent = 0;
  const failedRecipients: string[] = [];

  for (const recipient of recipientEmails) {
    try {
      await sender.sendTransacEmail({
        sender: email.sender,
        replyTo: email.replyTo,
        subject: email.subject,
        textContent: email.textContent,
        htmlContent: email.htmlContent,
        to: [{ email: recipient }],
      });
      sent += 1;
    } catch {
      failedRecipients.push(recipient);
    }
  }

  return { attempted: recipientEmails.length, sent, failedRecipients };
}
