"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { BrandButton, BrandCard, PageShell } from "../ui";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function DailyPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [subscribedWhileSignedIn, setSubscribedWhileSignedIn] = useState<boolean | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (!response.ok) {
        throw new Error("Subscription failed");
      }

      const {
        data: { user },
      } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
      if (user && supabase) {
        const { error } = await supabase
          .from("profiles")
          .update({ daily_email_subscriber: true })
          .eq("id", user.id);
        if (error) {
          console.error("Could not update profile subscriber flag", error);
        }
      }
      setSubscribedWhileSignedIn(Boolean(user));
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage(
        "Something went wrong. Try again or email us at hello@tinypauses.com",
      );
    }
  }

  return (
    <PageShell maxWidth="sm">
      <section className="flex flex-1 items-center justify-center py-4 sm:py-8">
        <div className="w-full space-y-8 text-center">
          <header className="space-y-4">
            <h1 className="text-balance text-4xl font-semibold leading-tight text-[color:var(--color-primary)] sm:text-5xl">
              One tiny pause. Every morning.
            </h1>
            <p className="mx-auto max-w-xl text-balance text-base text-[color:var(--color-foreground)]/78 sm:text-lg">
              A short mindful moment delivered to your inbox daily. No streaks. No pressure.
              Just a small pause to start your day.
            </p>
          </header>

          <BrandCard>
            {status === "success" ? (
              <div className="space-y-3">
                <p className="rounded-2xl bg-[color:var(--color-accent-soft)] px-4 py-4 text-sm font-medium text-[color:var(--color-ink-on-accent-soft)]">
                  You&apos;re in. Check your inbox for your first tiny pause. 🌱
                </p>
                {subscribedWhileSignedIn === false && (
                  <p className="text-center text-xs text-[color:var(--color-foreground)]/62">
                    Want to save your moments too?{" "}
                    <Link
                      href="/signup"
                      className="underline decoration-[color:var(--color-foreground)]/38 underline-offset-2 hover:text-[color:var(--color-foreground)]/85"
                    >
                      Create a free account.
                    </Link>
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <label
                  htmlFor="daily-email"
                  className="block text-sm font-medium text-[color:var(--color-primary)]"
                >
                  Your email address
                </label>
                <input
                  id="daily-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Your email address"
                  className="w-full rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-primary)] shadow-sm outline-none placeholder:text-[color:var(--color-foreground)]/40 focus:border-[color:var(--color-accent)] focus:ring-2 focus:ring-[color:var(--color-accent-soft)]"
                />
                <BrandButton type="submit" fullWidth disabled={status === "loading"}>
                  {status === "loading" ? "Sending..." : "Send me daily pauses"}
                </BrandButton>
                <p className="text-center text-xs text-[color:var(--color-foreground)]/58">
                  No spam. No selling your data. Unsubscribe any time.
                </p>
                {status === "error" && (
                  <p className="text-center text-sm text-red-600">{errorMessage}</p>
                )}
              </form>
            )}
          </BrandCard>

          <section className="mx-auto max-w-xl space-y-2 text-left">
            <h2 className="text-sm font-semibold text-[color:var(--color-primary)]">
              What you&apos;ll get:
            </h2>
            <p className="text-sm leading-7 text-[color:var(--color-foreground)]/78">
              One prompt each morning -- a simple mindful moment that takes about two minutes.
              Sometimes it&apos;s noticing something around you. Sometimes it&apos;s a breath.
              Sometimes it&apos;s being kind to yourself for thirty seconds.
            </p>
            <p className="text-sm leading-7 text-[color:var(--color-foreground)]/78">
              That&apos;s it. We won&apos;t try to sell you anything.
            </p>
          </section>

          <p className="text-sm text-[color:var(--color-foreground)]/58">
            Designed for kids 9-12. Loved by grown-ups too.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
