"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { BrandButton, BrandCard, BrandPill, PageShell } from "../ui";

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
    <PageShell maxWidth="md">
      <header className="text-center space-y-1">
        <BrandPill>Mindful moment</BrandPill>
        <h1 className="mt-1 text-2xl font-semibold text-[color:var(--color-primary)]">
          {step === "choose" && "What do you want help with today?"}
          {step === "prompt" && "Try this tiny pause"}
          {step === "mood" && "How do you feel now?"}
          {step === "done" && "Nice work taking a pause"}
        </h1>
      </header>

      {step === "choose" && (
        <BrandCard>
          <p className="text-sm text-[color:var(--color-foreground)]/85">
            Pick the kind of moment that would feel most helpful right now.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button
              type="button"
              onClick={async () => {
                const selected: PromptKind = "pause";
                setKind(selected);
                await loadPromptForKind(selected);
                setStep("prompt");
              }}
              className="rounded-2xl border border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] px-3 py-2 text-xs font-medium text-[color:var(--color-primary)] transition"
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
              className="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-2 text-xs font-medium text-[color:var(--color-foreground)]/85 transition hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-soft)]"
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
              className="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-2 text-xs font-medium text-[color:var(--color-foreground)]/85 transition hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-soft)]"
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
              className="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-2 text-xs font-medium text-[color:var(--color-foreground)]/85 transition hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-soft)]"
            >
              Kindness
            </button>
          </div>
          <BrandButton href="/" variant="secondary" fullWidth>
            Maybe later
          </BrandButton>
        </BrandCard>
      )}

      {step === "prompt" && (
        <BrandCard>
          {loadingPrompt || !prompt || !kind ? (
            <p className="text-sm text-[color:var(--color-foreground)]/85">
              Finding a prompt…
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[color:var(--color-primary)]">
                  {prompt.title}
                </h2>
                <p className="text-sm text-[color:var(--color-foreground)]/85">
                  {prompt.body}
                </p>
              </div>
              <div className="mt-4 rounded-2xl bg-[color:var(--color-accent-soft)] p-4 text-sm text-[color:var(--color-primary)]">
                <p className="font-medium">Your tiny step</p>
                <p className="mt-1">{prompt.step}</p>
              </div>
            </>
          )}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <BrandButton
              type="button"
              onClick={() => setStep("mood")}
              fullWidth
            >
              I&apos;m ready
            </BrandButton>
            <BrandButton href="/" variant="secondary" fullWidth>
              Maybe later
            </BrandButton>
          </div>
        </BrandCard>
      )}

      {step === "mood" && (
        <BrandCard>
          <p className="text-sm text-[color:var(--color-foreground)]/85">
            There&apos;s no right answer. This just helps you notice how your
            body and brain feel after taking a tiny pause.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {moodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setMood(option.value);
                  recordSession(option.value);
                  setStep("done");
                }}
                className={`flex flex-col items-center rounded-2xl border bg-[color:var(--color-surface)] px-3 py-2 text-xs font-medium transition ${
                  mood === option.value
                    ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-primary)]"
                    : "border-[color:var(--color-border-subtle)] text-[color:var(--color-foreground)]/85 hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-soft)]"
                }`}
              >
                <span className="text-lg">{option.emoji}</span>
                <span className="mt-1">{option.label}</span>
              </button>
            ))}
          </div>
          <BrandButton
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => {
              recordSession(null);
              setStep("done");
            }}
          >
            Skip for now
          </BrandButton>
        </BrandCard>
      )}

      {step === "done" && (
        <BrandCard tone="accent">
          <div className="space-y-4 text-center">
            <p className="text-4xl">🌱</p>
            <p className="text-base font-medium text-[color:var(--color-primary)]">
              Taking even one tiny pause like this is a big deal.
            </p>
            <p className="text-sm text-[color:var(--color-foreground)]/85">
              You can come back for another moment any time you like. For now,
              notice one more thing around you that makes you feel okay or safe.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <BrandButton href="/dashboard">
                Go to my dashboard
              </BrandButton>
              <BrandButton href="/" variant="secondary">
                Back to home
              </BrandButton>
            </div>
          </div>
        </BrandCard>
      )}
    </PageShell>
  );
}

