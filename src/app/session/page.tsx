"use client";

import { type CSSProperties, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { BrandButton, BrandCard, BrandPill, PageShell } from "../ui";

type PromptKind = "pause" | "letting-go" | "reflect" | "kindness";

type Prompt = {
  id: string;
  title: string;
  body: string;
  step: string;
};

const fallbackPrompts: Record<PromptKind, Prompt> = {
  pause: {
    id: "fallback-pause-color-hunt",
    title: "Color Hunt",
    body: "Look around the room and quietly name three things you can see that are blue or green.",
    step: "Take three slow breaths. With each breath, gently focus your eyes on one of the colors you found.",
  },
  "letting-go": {
    id: "fallback-letting-go-heavy-backpack",
    title: "Heavy Backpack",
    body: "Imagine you’re wearing a backpack that’s holding your worries from today.",
    step: "Take three slow breaths. With each breath out, picture taking one worry out of the backpack and setting it down.",
  },
  reflect: {
    id: "fallback-reflect-tiny-good-thing",
    title: "Tiny Good Thing",
    body: "Think back over today. What is one tiny good thing that happened, even if it was very small?",
    step: "Close your eyes for a moment and replay that tiny good thing in your mind, like a short video.",
  },
  kindness: {
    id: "fallback-kindness-quiet-kindness",
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

const stepOrder = ["choose", "prompt", "mood", "done"] as const;
const stepLabels: Record<(typeof stepOrder)[number], string> = {
  choose: "Choose",
  prompt: "Prompt",
  mood: "Mood",
  done: "Done",
};

const kindLabels: Record<PromptKind, string> = {
  pause: "Just a pause",
  "letting-go": "Letting go of stuff",
  reflect: "Reflecting on today",
  kindness: "Kindness",
};

type FavoritePrompt = {
  id: string;
  kind: PromptKind | null;
  title: string;
  body: string;
  step: string;
  savedAt: string;
};

export default function SessionPage() {
  const [step, setStep] = useState<"choose" | "prompt" | "mood" | "done">(
    "choose",
  );
  const [mood, setMood] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [kind, setKind] = useState<PromptKind | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [isPromptSaved, setIsPromptSaved] = useState(false);

  const accentByStep: Record<
    "choose" | "prompt" | "mood" | "done",
    string
  > = {
    choose: "#25e0c5", // teal
    prompt: "#ff2f92", // pink
    mood: "#ffd84a", // yellow
    done: "#9f7fff", // purple
  };

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
          .select("id, title, body, step")
          .eq("kind", selectedKind)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(20);

        if (!error && data && data.length > 0) {
          const random =
            data[Math.floor(Math.random() * Math.min(data.length, 20))];
          setPrompt({
            id: random.id,
            title: random.title,
            body: random.body,
            step: random.step,
          });
          setIsPromptSaved(false);
          return;
        }
      }

      // Fallback to built‑in prompt if Supabase is not set up or empty.
      setPrompt(fallbackPrompts[selectedKind]);
      setIsPromptSaved(false);
    } catch (err) {
      console.error("Error loading prompt", err);
      setPrompt(fallbackPrompts[selectedKind]);
      setIsPromptSaved(false);
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

  function goToStep(target: "choose" | "prompt" | "mood" | "done") {
    setStep(target);
  }

  function startAnotherRound() {
    setMood(null);
    setKind(null);
    setPrompt(null);
    setLoadingPrompt(false);
    setIsPromptSaved(false);
    setStep("choose");
  }

  function saveCurrentPrompt() {
    if (!prompt) return;

    try {
      const current: FavoritePrompt[] = JSON.parse(
        window.localStorage.getItem("tinyPause.favoritePrompts") ??
          window.localStorage.getItem("practice.favoritePrompts") ??
          "[]",
      ) as FavoritePrompt[];

      const exists = current.some((p) => p.id === prompt.id);
      if (exists) {
        setIsPromptSaved(true);
        return;
      }

      const next: FavoritePrompt[] = [
        {
          id: prompt.id,
          kind,
          title: prompt.title,
          body: prompt.body,
          step: prompt.step,
          savedAt: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 100);

      window.localStorage.setItem(
        "tinyPause.favoritePrompts",
        JSON.stringify(next),
      );
      setIsPromptSaved(true);
    } catch (error) {
      console.error("Could not save favorite prompt", error);
    }
  }

  return (
    <PageShell maxWidth="md">
      <div
        style={
          {
            "--color-accent": accentByStep[step],
          } as CSSProperties
        }
        className="space-y-5"
      >
        <header className="text-center space-y-1.5">
          {step !== "choose" && (
            <BrandPill>
              {kind ? kindLabels[kind] : "Mindful moment"}
            </BrandPill>
          )}
          <h1 className="mt-1 text-2xl font-semibold leading-tight text-[color:var(--color-primary)]">
            {step === "choose" && "What do you want help with today?"}
            {step === "prompt" && "Try this tiny pause"}
            {step === "mood" && "How do you feel now?"}
            {step === "done" && "Nice work taking a pause"}
          </h1>
          <div className="mx-auto h-1 w-16 rounded-full bg-[color:var(--color-accent)]" />
          <div className="mx-auto mt-3 flex max-w-sm items-center justify-between gap-2">
            {stepOrder.map((s, idx) => {
              const activeIndex = stepOrder.indexOf(step);
              const isComplete = idx <= activeIndex;

              return (
                <div key={s} className="flex flex-1 flex-col items-center gap-1">
                  <span
                    className={`h-2 w-full rounded-full ${
                      isComplete
                        ? "bg-[color:var(--color-accent)]"
                        : "bg-[color:var(--color-surface-soft)]"
                    }`}
                  />
                  <span className="text-[10px] uppercase tracking-wide text-[color:var(--color-foreground)]/60">
                    {stepLabels[s]}
                  </span>
                </div>
              );
            })}
          </div>
        </header>

        {step === "choose" && (
          <BrandCard>
          <p className="text-sm text-[color:var(--color-foreground)]/85">
            Pick the kind of moment that would feel most helpful right now.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={async () => {
                const selected: PromptKind = "pause";
                setKind(selected);
                await loadPromptForKind(selected);
                setStep("prompt");
              }}
              className="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm font-medium text-[color:var(--color-foreground)]/90 transition hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-surface-soft)]"
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
              className="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm font-medium text-[color:var(--color-foreground)]/90 transition hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-surface-soft)]"
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
              className="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm font-medium text-[color:var(--color-foreground)]/90 transition hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-surface-soft)]"
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
              className="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm font-medium text-[color:var(--color-foreground)]/90 transition hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-surface-soft)]"
            >
              Kindness
            </button>
          </div>
          <div className="mt-3">
            <BrandButton href="/" variant="secondary" fullWidth>
              Maybe later
            </BrandButton>
          </div>
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
              <div className="mt-4 rounded-2xl bg-[color:var(--color-accent-soft)] p-4 text-sm text-[color:var(--color-ink-on-accent-soft)]">
                <p className="font-medium">Your tiny step</p>
                <p className="mt-1">{prompt.step}</p>
              </div>
              <div className="mt-3">
                <BrandButton
                  type="button"
                  onClick={() => setStep("mood")}
                  fullWidth
                >
                  I&apos;m ready
                </BrandButton>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => goToStep("choose")}
                  className="px-1 py-1 text-[color:var(--color-foreground)]/65 hover:text-[color:var(--color-primary)]"
                >
                  Back
                </button>
                <a
                  href="/"
                  className="px-1 py-1 text-[color:var(--color-foreground)]/65 hover:text-[color:var(--color-primary)]"
                >
                  Maybe later
                </a>
              </div>
            </>
          )}
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
                    ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-ink-on-accent-soft)]"
                    : "border-[color:var(--color-border-subtle)] text-[color:var(--color-foreground)]/85 hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-surface-soft)]"
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
            onClick={() => goToStep("prompt")}
          >
            Back
          </BrandButton>
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
            <p className="text-base font-medium text-[color:var(--color-ink-on-accent-soft)]">
              Taking even one tiny pause like this is a big deal.
            </p>
            <p className="text-sm text-[color:var(--color-ink-on-accent-soft)]/90">
              You can come back for another moment any time you like. For now,
              notice one more thing around you that makes you feel okay or safe.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <BrandButton type="button" onClick={startAnotherRound} fullWidth>
                Try another round
              </BrandButton>
              <BrandButton
                type="button"
                variant="secondary"
                onClick={saveCurrentPrompt}
                fullWidth
              >
                {isPromptSaved ? "Saved to favorites" : "Save this prompt"}
              </BrandButton>
              <BrandButton href="/dashboard" fullWidth>
                Go to my dashboard
              </BrandButton>
              <BrandButton href="/" variant="secondary" fullWidth>
                Back to home
              </BrandButton>
            </div>
          </div>
          </BrandCard>
        )}
      </div>
    </PageShell>
  );
}

