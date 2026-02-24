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
  { value: 1, label: "Not great" },
  { value: 2, label: "A little off" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Pretty good" },
  { value: 5, label: "Really good" },
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
  "letting-go": "Letting go",
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

function MoodFace({ level }: { level: number }) {
  const stroke = "currentColor";
  const face = (() => {
    switch (level) {
      case 1:
        return (
          <>
            <line x1="10" y1="14" x2="13" y2="13" />
            <line x1="22" y1="13" x2="25" y2="14" />
            <path d="M11 25 Q18 20 25 25" />
          </>
        );
      case 2:
        return (
          <>
            <circle cx="12" cy="13.5" r="1.2" />
            <circle cx="24" cy="13.5" r="1.2" />
            <path d="M12 24 Q18 22.5 24 24" />
          </>
        );
      case 3:
        return (
          <>
            <circle cx="12" cy="13.5" r="1.2" />
            <circle cx="24" cy="13.5" r="1.2" />
            <line x1="12" y1="23.5" x2="24" y2="23.5" />
          </>
        );
      case 4:
        return (
          <>
            <circle cx="12" cy="13.5" r="1.2" />
            <circle cx="24" cy="13.5" r="1.2" />
            <path d="M12 22.5 Q18 27 24 22.5" />
          </>
        );
      default:
        return (
          <>
            <path d="M9 13 Q12 11 15 13" />
            <path d="M21 13 Q24 11 27 13" />
            <path d="M11 22 Q18 29 25 22" />
          </>
        );
    }
  })();

  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-current"
    >
      <circle cx="18" cy="18" r="14.5" stroke={stroke} strokeWidth="1.6" />
      <g stroke={stroke} strokeWidth="1.8" strokeLinecap="round">
        {face}
      </g>
    </svg>
  );
}

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
  const [shareLoading, setShareLoading] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const accentByStep: Record<
    "choose" | "prompt" | "mood" | "done",
    string
  > = {
    choose: "#25e0c5", // teal
    prompt: "#ff2f92", // pink
    mood: "#ffd84a", // yellow
    done: "#9f7fff", // purple
  };
  const accentByKind: Record<PromptKind, string> = {
    pause: "#25e0c5",
    "letting-go": "#ff2f92",
    reflect: "#ffd84a",
    kindness: "#9f7fff",
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

  function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function drawSprout(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    color: string,
  ) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 14;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 40);
    ctx.bezierCurveTo(centerX - 4, centerY - 18, centerX + 4, centerY - 62, centerX, centerY - 120);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(centerX - 46, centerY - 118, 56, 30, -0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(centerX + 46, centerY - 118, 56, 30, 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  async function generateShareCardBlob() {
    const size = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create share canvas.");

    const badgeColor = kind ? accentByKind[kind] : "#9f7fff";
    const badgeLabel = (kind ? kindLabels[kind] : "Mindful moment").toUpperCase();
    const promptTitle = prompt?.title ?? "Tiny pause";

    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, "#ffedd8");
    gradient.addColorStop(1, "#ffe3c1");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = "rgba(255,255,255,0.34)";
    drawRoundedRect(ctx, 86, 86, 908, 908, 48);
    ctx.fill();

    ctx.font = "700 44px Inter, Avenir Next, Segoe UI, sans-serif";
    const badgeWidth = Math.max(260, ctx.measureText(badgeLabel).width + 90);
    const badgeX = (size - badgeWidth) / 2;
    const badgeY = 170;
    ctx.fillStyle = badgeColor;
    drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, 78, 39);
    ctx.fill();

    ctx.fillStyle = "#121826";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeLabel, size / 2, badgeY + 40);

    drawSprout(ctx, size / 2, 520, "#2f7e58");

    ctx.fillStyle = "#1b2438";
    ctx.font = "600 58px Inter, Avenir Next, Segoe UI, sans-serif";
    ctx.fillText("I took a tiny pause today.", size / 2, 700);

    ctx.fillStyle = "rgba(27, 36, 56, 0.82)";
    ctx.font = "500 38px Inter, Avenir Next, Segoe UI, sans-serif";
    ctx.fillText(promptTitle, size / 2, 768);

    ctx.fillStyle = "rgba(27, 36, 56, 0.6)";
    ctx.font = "500 30px Inter, Avenir Next, Segoe UI, sans-serif";
    ctx.fillText("tinypause.app", size / 2, 952);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("Could not encode share image.");
    return blob;
  }

  function closeShareModal() {
    if (shareImageUrl) URL.revokeObjectURL(shareImageUrl);
    setShareImageUrl(null);
    setShowShareModal(false);
  }

  async function handleShareMoment() {
    if (shareLoading) return;
    setShareLoading(true);
    try {
      const blob = await generateShareCardBlob();
      const file = new File([blob], "tiny-pause-moment.png", { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };

      const canShareFiles =
        typeof nav.share === "function" &&
        typeof nav.canShare === "function" &&
        nav.canShare({ files: [file] });

      if (canShareFiles) {
        await nav.share({
          title: "Tiny Pause",
          text: "I took a tiny pause today.",
          files: [file],
        });
        return;
      }

      if (shareImageUrl) URL.revokeObjectURL(shareImageUrl);
      const objectUrl = URL.createObjectURL(blob);
      setShareImageUrl(objectUrl);
      setShowShareModal(true);
    } catch (error) {
      console.error("Unable to share moment", error);
    } finally {
      setShareLoading(false);
    }
  }

  function downloadShareImage() {
    if (!shareImageUrl) return;
    const link = document.createElement("a");
    link.href = shareImageUrl;
    link.download = "tiny-pause-moment.png";
    link.click();
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
              Letting go
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
          <a
            href="/"
            className="mt-3 inline-block text-xs text-[color:var(--color-foreground)]/62 transition hover:text-[color:var(--color-foreground)]/86"
          >
            Maybe later
          </a>
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
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {moodOptions.slice(0, 4).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setMood(option.value);
                  recordSession(option.value);
                  setStep("done");
                }}
                className={`flex flex-col items-center rounded-2xl border bg-[color:var(--color-surface)] px-3 py-2.5 text-xs font-medium transition ${
                  mood === option.value
                    ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-ink-on-accent-soft)]"
                    : "border-[color:var(--color-border-subtle)] text-[color:var(--color-foreground)]/85 hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-surface-soft)]"
                }`}
              >
                <MoodFace level={option.value} />
                <span className="mt-1">{option.label}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const option = moodOptions[4];
              setMood(option.value);
              recordSession(option.value);
              setStep("done");
            }}
            className={`mt-3 flex w-full flex-col items-center rounded-2xl border bg-[color:var(--color-surface)] px-3 py-2.5 text-xs font-medium transition ${
              mood === moodOptions[4].value
                ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-ink-on-accent-soft)]"
                : "border-[color:var(--color-border-subtle)] text-[color:var(--color-foreground)]/85 hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-surface-soft)]"
            }`}
          >
            <MoodFace level={moodOptions[4].value} />
            <span className="mt-1">{moodOptions[4].label}</span>
          </button>
          <button
            type="button"
            onClick={() => goToStep("prompt")}
            className="mt-2 self-start px-1 py-1 text-xs text-[color:var(--color-foreground)]/65 hover:text-[color:var(--color-primary)]"
          >
            Back
          </button>
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
            <button
              type="button"
              onClick={handleShareMoment}
              disabled={shareLoading}
              className="mx-auto inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[#8f67ff] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(143,103,255,0.35)] transition hover:bg-[#7f57ef] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
              >
                <path
                  d="M10 2.5l1.3 3.2 3.2 1.3-3.2 1.3-1.3 3.2-1.3-3.2-3.2-1.3 3.2-1.3L10 2.5zM15.5 10.2l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"
                  fill="currentColor"
                />
              </svg>
              {shareLoading ? "Preparing image..." : "Share this moment"}
            </button>
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
            </div>
          </div>
          </BrandCard>
        )}
        {showShareModal && shareImageUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4">
            <div className="w-full max-w-md rounded-2xl bg-[color:var(--color-surface)] p-4 shadow-[0_22px_55px_rgba(2,6,23,0.45)]">
              <img
                src={shareImageUrl}
                alt="Share card preview"
                className="w-full rounded-xl border border-[color:var(--color-border-subtle)]"
              />
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <BrandButton type="button" onClick={downloadShareImage} fullWidth>
                  Download image
                </BrandButton>
                <BrandButton
                  type="button"
                  variant="secondary"
                  onClick={closeShareModal}
                  fullWidth
                >
                  Close
                </BrandButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

