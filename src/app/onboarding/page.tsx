"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 via-indigo-50 to-violet-50 px-4">
        <p className="text-sm text-slate-700">Getting things ready…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 via-indigo-50 to-violet-50 px-4">
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 py-12">
        <header className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            PracticeApp
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Let&apos;s set up your calm corner
          </h1>
          <p className="text-sm text-slate-700">
            Just a couple of quick questions so we can talk to you in the right
            way.
          </p>
        </header>

        <section className="rounded-3xl bg-white/90 p-6 shadow-lg shadow-sky-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2 text-left">
              <label
                htmlFor="nickname"
                className="block text-sm font-medium text-slate-900"
              >
                What should we call you?
              </label>
              <p className="text-xs text-slate-600">
                This can be a first name or a nickname. It&apos;s how we&apos;ll
                greet you on your dashboard.
              </p>
              <input
                id="nickname"
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-sky-100 placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                placeholder="Sunny, Jordan, Sky..."
              />
            </div>

            <div className="space-y-2 text-left">
              <p className="block text-sm font-medium text-slate-900">
                How old is the person using PracticeApp?
              </p>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {ageOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAgeBand(option.value)}
                    className={`rounded-2xl border px-3 py-2 text-xs font-medium transition ${
                      ageBand === option.value
                        ? "border-sky-500 bg-sky-50 text-sky-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!nickname || saving}
              className="flex w-full items-center justify-center rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-sky-200 transition hover:bg-sky-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-sky-300"
            >
              {saving ? "Saving..." : "Save and go to my dashboard"}
            </button>

            {error && (
              <p className="text-xs text-rose-600" role="alert">
                {error}
              </p>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}

