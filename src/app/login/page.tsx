"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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

      const { error } = await supabase.auth.signInWithOtp({
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 via-indigo-50 to-violet-50 px-4">
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 py-12">
        <header className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            PracticeApp
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Log in to keep track
          </h1>
          <p className="text-sm text-slate-700">
            We use a simple sign‑in link. No passwords to remember, ever.
          </p>
        </header>

        <section className="rounded-3xl bg-white/90 p-6 shadow-lg shadow-sky-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2 text-left">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-900"
              >
                Grown‑up&apos;s email
              </label>
              <p className="text-xs text-slate-600">
                We&apos;ll send a secure link to this address so you can manage
                your child&apos;s practice.
              </p>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-sky-100 placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                placeholder="you@example.com"
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={isParent}
                onChange={(e) => setIsParent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
              />
              <span>
                I&apos;m a parent, caregiver, or teacher and I agree to help my
                child use PracticeApp kindly and safely.
              </span>
            </label>

            <button
              type="submit"
              disabled={!email || !isParent || status === "sending"}
              className="flex w-full items-center justify-center rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-sky-200 transition hover:bg-sky-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-sky-300"
            >
              {status === "sending" ? "Sending link..." : "Send me a sign‑in link"}
            </button>
          </form>

          {message && (
            <p className="mt-4 rounded-2xl bg-sky-50 px-4 py-3 text-xs text-sky-900">
              {message}
            </p>
          )}
        </section>

        <footer className="mt-2 text-center text-xs text-slate-500">
          Just exploring?{" "}
          <a href="/session" className="underline-offset-2 hover:underline">
            Try a mindful moment without logging in
          </a>
          .
        </footer>
      </main>
    </div>
  );
}

