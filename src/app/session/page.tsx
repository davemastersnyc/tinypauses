"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type PromptKind = "pause" | "letting-go" | "reflect" | "kindness";

type Prompt = {
  title: string;
  body: string;
  step: string;
};

const fallbackPrompts: Record<PromptKind, Prompt> = {
  pause: {
    title: "Color Hunt",
    body: "Look around the room and quietly name three things you can see that are blue or green.",
    step: "Take three slow breaths. With each breath, gently focus your eyes on one of the colors you found.",
  },
  "letting-go": {
    title: "Heavy Backpack",
    body: "Imagine you’re wearing a backpack that’s holding your worries from today.",
    step: "Take three slow breaths. With each breath out, picture taking one worry out of the backpack and setting it down.",
  },
  reflect: {
    title: "Tiny Good Thing",
    body: "Think back over today. What is one tiny good thing that happened, even if it was very small?",
    step: "Close your eyes for a moment and replay that tiny good thing in your mind, like a short video.",
  },
  kindness: {
    title: "Quiet Kindness",
    body: "Think of someone you know—a friend, classmate, or grown‑up.",
    step: "Take three slow breaths. With each breath out, quietly wish them something kind, like “I hope you feel calm” or “I hope you laugh today.”",
  },
};

const moodOptions = [
  { value: 1, label: "Not great", emoji: "😕" },
  { value: 2, label: "A little off", emoji: "🙁" },
  { value: 3, label: "Okay", emoji: "😐" },
  { value: 4, label: "Pretty good", emoji: "🙂" },
  { value: 5, label: "Really good", emoji: "😄" },
];

export default function SessionPage() {
  const [step, setStep] = useState<"choose" | "prompt" | "mood" | "done">(
    "choose",
  );
  const [mood, setMood] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [kind, setKind] = useState<PromptKind | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(false);

  useEffect(() => {
    async function loadUser() {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    }
    loadUser();
  }, []);

  async function loadPromptForKind(selectedKind: PromptKind) {
    setLoadingPrompt(true);
    setPrompt(null);

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("prompts")
          .select("title, body, step")
          .eq("kind", selectedKind)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(20);

        if (!error && data && data.length > 0) {
          const random =
            data[Math.floor(Math.random() * Math.min(data.length, 20))];
          setPrompt({
            title: random.title,
            body: random.body,
            step: random.step,
          });
          return;
        }
      }

      // Fallback to built‑in prompt if Supabase is not set up or empty.
      setPrompt(fallbackPrompts[selectedKind]);
    } catch (err) {
      console.error("Error loading prompt", err);
      setPrompt(fallbackPrompts[selectedKind]);
    } finally {
      setLoadingPrompt(false);
    }
  }

  async function recordSession(selectedMood: number | null) {
    if (!supabase) return;
    if (!userId) return;

    try {
      await supabase.from("sessions").insert({
        user_id: userId,
        mood_after: selectedMood,
        completed_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error recording session", error);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 via-indigo-50 to-violet-50 px-4">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 py-12">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            Mindful moment
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {step === "choose" && "What do you want help with today?"}
            {step === "prompt" && "Try this tiny pause"}
            {step === "mood" && "How do you feel now?"}
            {step === "done" && "Nice work taking a pause"}
          </h1>
        </header>

        {step === "choose" && (
          <section className="space-y-6 rounded-3xl bg-white/90 p-6 shadow-lg shadow-sky-100">
            <p className="text-sm text-slate-700">
              Pick the kind of moment that would feel most helpful right now.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <button
                type="button"
                onClick={async () => {
                  const selected: PromptKind = "pause";
                  setKind(selected);
                  await loadPromptForKind(selected);
                  setStep("prompt");
                }}
                className="rounded-2xl border border-slate-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-900 transition hover:border-sky-400 hover:bg-sky-100"
              >
                Just a pause
              </button>
              <button
                type="button"
                onClick={async () => {
                  const selected: PromptKind = "letting-go";
                  setKind(selected);
                  await loadPromptForKind(selected);
                  setStep("prompt");
                }}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 transition hover:border-sky-400 hover:bg-sky-50"
              >
                Letting go of stuff
              </button>
              <button
                type="button"
                onClick={async () => {
                  const selected: PromptKind = "reflect";
                  setKind(selected);
                  await loadPromptForKind(selected);
                  setStep("prompt");
                }}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 transition hover:border-sky-400 hover:bg-sky-50"
              >
                Reflecting on today
              </button>
              <button
                type="button"
                onClick={async () => {
                  const selected: PromptKind = "kindness";
                  setKind(selected);
                  await loadPromptForKind(selected);
                  setStep("prompt");
                }}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 transition hover:border-sky-400 hover:bg-sky-50"
              >
                Kindness
              </button>
            </div>
            <a
              href="/"
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Maybe later
            </a>
          </section>
        )}

        {step === "prompt" && (
          <section className="space-y-6 rounded-3xl bg-white/90 p-6 shadow-lg shadow-sky-100">
            {loadingPrompt || !prompt || !kind ? (
              <p className="text-sm text-slate-700">Finding a prompt…</p>
            ) : (
              <>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {prompt.title}
                  </h2>
                  <p className="text-sm text-slate-700">{prompt.body}</p>
                </div>
                <div className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-900">
                  <p className="font-medium">Your tiny step</p>
                  <p className="mt-1">{prompt.step}</p>
                </div>
              </>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setStep("mood")}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-sky-200 transition hover:bg-sky-700 hover:shadow-lg"
              >
                I&apos;m ready
              </button>
              <a
                href="/"
                className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Maybe later
              </a>
            </div>
          </section>
        )}

        {step === "mood" && (
          <section className="space-y-6 rounded-3xl bg-white/90 p-6 shadow-lg shadow-sky-100">
            <p className="text-sm text-slate-700">
              There&apos;s no right answer. This just helps you notice how your
              body and brain feel after taking a tiny pause.
            </p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setMood(option.value);
                    recordSession(option.value);
                    setStep("done");
                  }}
                  className={`flex flex-col items-center rounded-2xl border bg-white px-3 py-2 text-xs font-medium transition hover:border-sky-400 hover:bg-sky-50 ${
                    mood === option.value
                      ? "border-sky-500 bg-sky-50 text-sky-900"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  <span className="text-lg">{option.emoji}</span>
                  <span className="mt-1">{option.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                recordSession(null);
                setStep("done");
              }}
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Skip for now
            </button>
          </section>
        )}

        {step === "done" && (
          <section className="space-y-6 rounded-3xl bg-white/90 p-6 text-center shadow-lg shadow-sky-100">
            <p className="text-4xl">🌱</p>
            <p className="text-base font-medium text-slate-900">
              Taking even one tiny pause like this is a big deal.
            </p>
            <p className="text-sm text-slate-700">
              You can come back for another moment any time you like. For now,
              notice one more thing around you that makes you feel okay or
              safe.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-sky-200 transition hover:bg-sky-700 hover:shadow-lg"
              >
                Go to my dashboard
              </a>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Back to home
              </a>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

