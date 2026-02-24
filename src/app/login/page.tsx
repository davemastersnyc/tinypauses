"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { BrandButton, BrandCard, BrandPill, PageShell } from "../ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isParent, setIsParent] = useState(true);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setMessage(null);

    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/dashboard`
          : undefined;

      const { error } = await supabase!.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            role: isParent ? "parent" : "kid",
          },
        },
      });

      if (error) {
        throw error;
      }

      setStatus("sent");
      setMessage(
        "Check your email for a sign‑in link. After you click it, we’ll bring you back here to your dashboard.",
      );
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage(
        "Something went wrong sending the link. Please double‑check your email and try again.",
      );
    }
  }

  return (
    <PageShell maxWidth="sm">
      <header className="space-y-2 text-center">
        <BrandPill>Log in to keep track</BrandPill>
        <h1 className="text-2xl font-semibold text-[color:var(--color-primary)]">
          We&apos;ll email you a link.
        </h1>
        <p className="text-sm text-[color:var(--color-foreground)]/80">
          No passwords to remember, ever. Just a simple, secure sign‑in link for
          grown‑ups.
        </p>
      </header>

      <BrandCard>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2 text-left">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[color:var(--color-primary)]"
            >
              Grown‑up&apos;s email
            </label>
            <p className="text-xs text-[color:var(--color-foreground)]/75">
              We&apos;ll send a sign‑in link to this address so you can gently
              keep track of practice.
            </p>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-primary)] shadow-sm outline-none placeholder:text-[color:var(--color-foreground)]/40 focus:border-[color:var(--color-accent)] focus:ring-2 focus:ring-[color:var(--color-accent-soft)]"
              placeholder="you@example.com"
            />
          </div>

          <label className="flex items-start gap-2 text-xs text-[color:var(--color-foreground)]/80">
            <input
              type="checkbox"
              checked={isParent}
              onChange={(e) => setIsParent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[color:var(--color-border-subtle)] text-[color:var(--color-accent)] focus:ring-[color:var(--color-accent)]"
            />
            <span>
              I&apos;m a parent, caregiver, or teacher and I agree to help my
              child use Practice kindly and safely.
            </span>
          </label>

          <BrandButton
            type="submit"
            fullWidth
            disabled={!email || !isParent || status === "sending"}
          >
            {status === "sending" ? "Sending link..." : "Send me a sign‑in link"}
          </BrandButton>
        </form>

        {message && (
          <p className="mt-4 rounded-2xl bg-[color:var(--color-accent-soft)] px-4 py-3 text-xs text-[color:var(--color-primary)]">
            {message}
          </p>
        )}
      </BrandCard>

      <footer className="mt-2 text-center text-xs text-[color:var(--color-foreground)]/70">
        Just exploring?{" "}
        <a
          href="/session"
          className="font-medium text-[color:var(--color-accent)] underline-offset-2 hover:underline"
        >
          Try a mindful moment without logging in
        </a>
        .
      </footer>
    </PageShell>
  );
}

