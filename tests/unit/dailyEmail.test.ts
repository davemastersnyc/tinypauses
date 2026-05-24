import assert from "node:assert/strict";
import { test } from "node:test";

import {
  sendDailyPromptToRecipients,
  type DailyPromptEmail,
  type TransactionalSender,
} from "../../src/lib/dailyEmail.ts";

const EMAIL: DailyPromptEmail = {
  sender: { email: "hello@tinypauses.com", name: "Tiny Pauses" },
  replyTo: { email: "hello@tinypauses.com", name: "Tiny Pauses" },
  subject: "Today's tiny pause",
  textContent: "text",
  htmlContent: "<p>html</p>",
};

// Records every payload the loop hands to Brevo so we can inspect the `to`
// arrays. Optionally fails for specific recipients.
function recordingSender(failFor: string[] = []) {
  const calls: Array<{ to: Array<{ email: string }> }> = [];
  const sender: TransactionalSender = {
    async sendTransacEmail(payload) {
      calls.push({ to: payload.to });
      const onlyRecipient = payload.to[0]?.email;
      if (onlyRecipient && failFor.includes(onlyRecipient)) {
        throw new Error(`simulated Brevo failure for ${onlyRecipient}`);
      }
      return { messageId: "fake" };
    },
  };
  return { sender, calls };
}

test("sends exactly one recipient per email and never batches addresses", async () => {
  const recipients = ["a@example.com", "b@example.com", "c@example.com"];
  const { sender, calls } = recordingSender();

  const result = await sendDailyPromptToRecipients(sender, EMAIL, recipients);

  // One message per recipient.
  assert.equal(calls.length, recipients.length);
  // THE invariant: no message ever carries more than one address.
  for (const call of calls) {
    assert.equal(call.to.length, 1, "each email must target exactly one recipient");
  }
  // Every intended recipient was reached, with no duplicates or leaks.
  const addressed = calls.map((call) => call.to[0].email).sort();
  assert.deepEqual(addressed, [...recipients].sort());

  assert.deepEqual(result, {
    attempted: 3,
    sent: 3,
    failedRecipients: [],
  });
});

test("a single failed recipient does not stop the rest of the send", async () => {
  const recipients = ["a@example.com", "bad@example.com", "c@example.com"];
  const { sender, calls } = recordingSender(["bad@example.com"]);

  const result = await sendDailyPromptToRecipients(sender, EMAIL, recipients);

  // All three were attempted, each as its own single-recipient message.
  assert.equal(calls.length, 3);
  for (const call of calls) {
    assert.equal(call.to.length, 1);
  }
  assert.equal(result.attempted, 3);
  assert.equal(result.sent, 2);
  assert.deepEqual(result.failedRecipients, ["bad@example.com"]);
});

test("total failure reports zero sent so the caller can keep the prompt retryable", async () => {
  const recipients = ["a@example.com", "b@example.com"];
  const { sender } = recordingSender(recipients);

  const result = await sendDailyPromptToRecipients(sender, EMAIL, recipients);

  assert.equal(result.attempted, 2);
  assert.equal(result.sent, 0);
  assert.deepEqual(result.failedRecipients, recipients);
});

test("empty recipient list sends nothing", async () => {
  const { sender, calls } = recordingSender();

  const result = await sendDailyPromptToRecipients(sender, EMAIL, []);

  assert.equal(calls.length, 0);
  assert.deepEqual(result, { attempted: 0, sent: 0, failedRecipients: [] });
});
