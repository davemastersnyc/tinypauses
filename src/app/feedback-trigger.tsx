"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type FeedbackStatus = "idle" | "sending" | "success" | "error";

export function FeedbackTrigger() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<FeedbackStatus>("idle");

  function closeModal() {
    setOpen(false);
    setMessage("");
    setStatus("idle");
  }

  async function submitFeedback() {
    setStatus("sending");
    try {
      const {
        data: { user },
      } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          userEmail: user?.email ?? null,
        }),
      });
      if (!response.ok) throw new Error("Failed to send feedback");

      setStatus("success");
      window.setTimeout(() => {
        closeModal();
      }, 1200);
    } catch (error) {
      console.error("Feedback send failed", error);
      setStatus("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-transparent p-0 text-inherit hover:text-[color:var(--color-primary)]"
      >
        Send feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="mb-3 text-sm font-medium text-[color:var(--color-primary)]">
              What&apos;s on your mind?
            </p>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-primary)] shadow-sm outline-none placeholder:text-[color:var(--color-foreground)]/40 focus:border-[color:var(--color-accent)] focus:ring-2 focus:ring-[color:var(--color-accent-soft)]"
              placeholder="Share any thought, bug, or idea."
            />

            {status === "success" && (
              <p className="mt-3 text-xs text-[color:var(--color-primary)]/75">
                Thanks. We read everything.
              </p>
            )}
            {status === "error" && (
              <p className="mt-3 text-xs text-red-600">
                Something went wrong. Please try again.
              </p>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-[var(--radius-pill)] border border-[color:var(--color-border-subtle)] px-4 py-2 text-xs font-medium text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-soft)]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={submitFeedback}
                disabled={status === "sending"}
                className="rounded-[var(--radius-pill)] bg-[color:var(--color-accent)] px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-[color:var(--color-accent)]/90 disabled:cursor-not-allowed disabled:bg-[color:var(--color-accent)]/45"
              >
                {status === "sending" ? "Sending..." : "Send it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
