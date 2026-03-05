"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { BrandButton, BrandCard, BrandPill, PageShell } from "../ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isParent, setIsParent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    async function checkExistingSession() {
      if (!supabase) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_complete")
          .eq("id", user.id)
          .maybeSingle();
        router.replace(profile?.onboarding_complete ? "/dashboard" : "/onboarding");
      }
    }

    checkExistingSession();
  }, [router]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = window.setInterval(() => {
      setCooldownSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [cooldownSeconds]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setMessage(null);

    try {
      if (!supabase) {
        throw new Error("Supabase client is not configured.");
      }
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
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
      setCooldownSeconds(35);
      setMessage(
        "Magic link sent. Check your inbox (and promotions/spam) for a Tiny Pauses sign‑in link.",
      );
    } catch (err) {
      console.error(err);
      setStatus("error");
      const errorMessage =
        err instanceof Error ? err.message : "Could not send sign-in link.";
      if (errorMessage.includes("after")) {
        setCooldownSeconds(35);
        setMessage(
          "Please wait about 35 seconds before requesting another sign-in link.",
        );
      } else {
        setMessage(
          "Something went wrong sending the link. Please double-check your email and try again.",
        );
      }
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
              keep track of moments in Tiny Pauses.
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
              child use Tiny Pauses kindly and safely.
            </span>
          </label>

          <BrandButton
            type="submit"
            fullWidth
            disabled={!email || !isParent || status === "sending" || cooldownSeconds > 0}
          >
            {status === "sending"
              ? "Sending link..."
              : cooldownSeconds > 0
                ? `Wait ${cooldownSeconds}s`
                : status === "sent"
                  ? "Send another sign‑in link"
                  : "Send me a sign‑in link"}
          </BrandButton>
        </form>

        {message && (
          <p className="mt-4 rounded-2xl bg-[color:var(--color-accent-soft)] px-4 py-3 text-xs text-[color:var(--color-ink-on-accent-soft)]">
            {message}
          </p>
        )}
      </BrandCard>

      <footer className="mt-2 text-center text-xs text-[color:var(--color-foreground)]/70">
        Just exploring?{" "}
        <a
          href="/session"
          className="font-medium text-[#ffd08a] underline-offset-2 hover:text-[#ffe3b8] hover:underline"
        >
          Try a mindful moment without logging in
        </a>
        .
      </footer>
    </PageShell>
  );
}

