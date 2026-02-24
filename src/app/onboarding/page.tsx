"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { BrandButton, BrandCard, BrandPill, PageShell } from "../ui";

const ageOptions = [
  { value: "9-10", label: "9–10 years" },
  { value: "11-12", label: "11–12 years" },
  { value: "grownup", label: "I’m a grown‑up" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [ageBand, setAgeBand] = useState("9-10");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      if (!supabase) {
        router.replace("/dashboard");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname, age_band")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.nickname) {
        // Already onboarded; go to dashboard.
        router.replace("/dashboard");
        return;
      }

      if (profile?.age_band) {
        setAgeBand(profile.age_band as string);
      }

      setLoading(false);
    }

    init();
  }, [router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          nickname,
          age_band: ageBand,
        },
        { onConflict: "id" },
      );

      if (upsertError) {
        throw upsertError;
      }

      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong saving that. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageShell maxWidth="sm">
        <BrandCard tone="muted">
          <p className="text-sm text-[color:var(--color-foreground)]/80">
            Getting things ready…
          </p>
        </BrandCard>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="sm">
      <header className="space-y-2 text-center">
        <BrandPill>Set up your calm corner</BrandPill>
        <h1 className="text-2xl font-semibold text-[color:var(--color-primary)]">
          A couple quick questions.
        </h1>
        <p className="text-sm text-[color:var(--color-foreground)]/80">
          This helps us talk to you in the right way and greet you by name.
        </p>
      </header>

      <BrandCard>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2 text-left">
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-[color:var(--color-primary)]"
            >
              What should we call you?
            </label>
            <p className="text-xs text-[color:var(--color-foreground)]/75">
              This can be a first name or a nickname. It&apos;s how we&apos;ll
              greet you on your dashboard.
            </p>
            <input
              id="nickname"
              type="text"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-primary)] shadow-sm outline-none placeholder:text-[color:var(--color-foreground)]/40 focus:border-[color:var(--color-accent)] focus:ring-2 focus:ring-[color:var(--color-accent-soft)]"
              placeholder="Sunny, Jordan, Sky..."
            />
          </div>

          <div className="space-y-2 text-left">
            <p className="block text-sm font-medium text-[color:var(--color-primary)]">
              How old is the person using Tiny Pause?
            </p>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {ageOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAgeBand(option.value)}
                  className={`rounded-2xl border px-3 py-2 text-xs font-medium transition ${
                    ageBand === option.value
                      ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-primary)]"
                      : "border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] text-[color:var(--color-foreground)]/85 hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-soft)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <BrandButton type="submit" fullWidth disabled={!nickname || saving}>
            {saving ? "Saving..." : "Save and go to my dashboard"}
          </BrandButton>

          {error && (
            <p className="text-xs text-rose-600" role="alert">
              {error}
            </p>
          )}
        </form>
      </BrandCard>
    </PageShell>
  );
}

