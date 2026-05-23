"use client";

import {
  Suspense,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  type MomentCardMetadata,
  renderCardBlob,
  renderCardCanvas,
  preloadCardAssets,
} from "@/lib/cardRenderer";
import { getSeasonalPalette } from "@/lib/cardStyles";
import {
  getFavorite,
  migrateLocalFavorites,
  saveFavorite,
} from "@/lib/favorites";
import {
  buildSeasonalContext,
  buildWeeklyContext,
  getActiveSeasonalWindow,
  getActiveWeeklyKey,
  pickSeasonalPrompt,
  pickWeeklyPrompt,
  type SeasonalWindowRow,
  type SpecialContext,
  type SpecialPromptRow,
} from "@/lib/specialPrompts";
import { personalMilestoneForCount } from "@/lib/social";
import { BrandButton, BrandCard, PageShell } from "../ui";

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

const defaultFinishMessage = {
  headline: "Taking even one tiny pause like this is a big deal.",
  body: "You can come back for another moment any time you like. For now, notice one more thing around you that makes you feel okay or safe.",
};

const moodFinishMessages: Record<number, { headline: string; body: string }> = {
  1: {
    headline: "Thank you for pausing, even on a hard day.",
    body: "Feeling not great is okay. You showed up anyway, and that counts. Be gentle with yourself for the rest of today.",
  },
  2: {
    headline: "A little off is still worth noticing.",
    body: "You gave yourself a moment to check in. That is a kind thing to do. Come back whenever you need another tiny pause.",
  },
  3: {
    headline: "Okay is a perfectly good place to be.",
    body: "You took a moment just for you. Before you go, find one more thing around you that feels calm or safe.",
  },
  4: {
    headline: "Pretty good is worth holding onto.",
    body: "Nice work taking this pause. Try to keep a little of this calm feeling with you for the next thing you do.",
  },
  5: {
    headline: "Really good. Soak it up.",
    body: "That is a lovely way to feel. Take one more slow breath and enjoy it before you move on.",
  },
};

function moodLabel(value: number) {
  return moodOptions.find((option) => option.value === value)?.label ?? "";
}

// A gentle one-liner describing the before/after mood shift. Never makes a kid
// feel bad when the number does not go up.
function moodShiftMessage(
  before: number | null,
  after: number | null,
): ReactNode | null {
  if (before === null || after === null) return null;
  if (after > before) {
    return (
      <>
        You went from{" "}
        <em className="text-[#006666]">{moodLabel(before).toLowerCase()}</em> to{" "}
        <em className="text-[#006666]">{moodLabel(after).toLowerCase()}</em>.
      </>
    );
  }
  if (after === before) {
    return (
      <>
        You came in feeling{" "}
        <em className="text-[#006666]">{moodLabel(after).toLowerCase()}</em> and
        stayed steady. That is okay.
      </>
    );
  }
  return "Checking in honestly is the brave part. Be extra gentle with yourself.";
}

const sessionKinds: { kind: PromptKind; label: string }[] = [
  { kind: "pause", label: "Just a pause" },
  { kind: "letting-go", label: "Letting go" },
  { kind: "reflect", label: "Reflecting on today" },
  { kind: "kindness", label: "Kindness" },
];

// When a kid arrives feeling low, gently steer toward releasing or kindness.
const lowMoodKinds: PromptKind[] = ["letting-go", "kindness"];

// Soft seasonal flecks that drift up behind the done-screen card. Purely
// decorative; hidden under prefers-reduced-motion (see globals.css).
const driftMotifs = [
  { left: "6%", size: 11, delay: "0s", duration: "8.5s" },
  { left: "24%", size: 7, delay: "1.7s", duration: "10.5s" },
  { left: "58%", size: 14, delay: "0.7s", duration: "9.3s" },
  { left: "80%", size: 8, delay: "2.6s", duration: "11.2s" },
  { left: "44%", size: 6, delay: "3.4s", duration: "9.9s" },
] as const;

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

type BrainBreakSoundMode = "quiet" | "sound";
type BrainBreakStep = { instruction: string };

const brainBreakAccent = "#66cccc";

const defaultBrainBreakSteps: BrainBreakStep[] = [
  {
    instruction:
      "Shake your hands like you're flicking water off them. Arms too if you want.",
  },
  {
    instruction:
      "Stomp your feet three times. Then press them flat into the floor and hold.",
  },
  {
    instruction:
      "Make your hands into fists. Squeeze hard for three seconds. Then let go completely.",
  },
  {
    instruction:
      "Touch something near you. Notice if it feels cool or warm. Just notice.",
  },
  {
    instruction:
      "Breathe in slowly through your nose. Out through your mouth. Do that three times.",
  },
  {
    instruction: "Your brain slowed down. You did that.",
  },
];

const togetherBannerKey = "tinyPauses.showTogetherBanner";
const togetherSessionKey = "tinyPauses.firstTogetherSession";
const pendingMomentKey = "pending_moment";
const firstVisitKey = "tinyPauses.hasVisited";

// Recently-shown prompt ids, kept locally so a kid does not see the same
// prompt twice in a row now that the library is large. Global across kinds.
const recentPromptsKey = "tinyPauses.recentPromptIds";
const recentPromptsMax = 10;

function readRecentPromptIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(recentPromptsKey) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function rememberPromptId(id: string) {
  if (typeof window === "undefined") return;
  const next = [id, ...readRecentPromptIds().filter((x) => x !== id)].slice(
    0,
    recentPromptsMax,
  );
  try {
    window.localStorage.setItem(recentPromptsKey, JSON.stringify(next));
  } catch {
    // ignore storage failures (private mode, quota)
  }
}

// Pick a prompt the kid has not seen recently; fall back to the full set once
// they have worked through everything.
function pickFreshPrompt<T extends { id: string }>(rows: T[]): T {
  const recent = new Set(readRecentPromptIds());
  const fresh = rows.filter((row) => !recent.has(row.id));
  const pool = fresh.length > 0 ? fresh : rows;
  return pool[Math.floor(Math.random() * pool.length)];
}

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

function BrainBreakStepVisual({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div className="flex items-center justify-center gap-3">
        <div className="bb-hand-wiggle-left">
          <Image
            src="/brain-break/shake.svg"
            alt=""
            width={200}
            height={200}
            className="h-28 w-28"
          />
        </div>
        <div className="bb-hand-wiggle-right">
          <Image
            src="/brain-break/shake.svg"
            alt=""
            width={200}
            height={200}
            className="h-28 w-28 -scale-x-100"
          />
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="bb-feet-pulse">
        <Image
          src="/brain-break/stomp.svg"
          alt=""
          width={200}
          height={200}
          className="h-32 w-32"
        />
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="bb-squeeze-left">
        <Image
          src="/brain-break/fist.svg"
          alt=""
          width={200}
          height={200}
          className="h-32 w-32"
        />
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="bb-warm-lines">
        <Image
          src="/brain-break/point.svg"
          alt=""
          width={200}
          height={200}
          className="h-32 w-32"
        />
      </div>
    );
  }

  if (step === 4) {
    return <div aria-hidden="true" className="bb-breath-orb h-36 w-36 rounded-full" />;
  }

  return <p className="text-6xl" aria-hidden="true">🌱</p>;
}

function ThemeIllustration({ kind }: { kind: PromptKind | null }) {
  const className = "theme-illustration h-16 w-16";

  if (kind === "pause") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true" className={className} fill="none">
        <circle cx="32" cy="32" r="6" fill="#66cccc" />
        <circle cx="32" cy="32" r="14" stroke="#66cccc" strokeWidth="2.5" opacity="0.6" />
        <circle cx="32" cy="32" r="22" stroke="#66cccc" strokeWidth="2.5" opacity="0.3" />
      </svg>
    );
  }

  if (kind === "letting-go") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true" className={className} fill="none">
        <ellipse cx="32" cy="22" rx="13" ry="15" fill="#7edfaa" />
        <path d="M29 36h6l-3 4z" fill="#3aa66f" />
        <path
          d="M32 40c0 4 2.5 5 2.5 8.5S32 53 32 56"
          stroke="#3aa66f"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (kind === "reflect") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true" className={className} fill="none">
        <path d="M38 12a22 22 0 1 0 14 38A18 18 0 0 1 38 12z" fill="#ffd84a" />
        <path
          d="M47 13l1.5 3.8 3.8 1.5-3.8 1.5L47 25l-1.5-3.7-3.8-1.5 3.8-1.5z"
          fill="#f5b400"
        />
      </svg>
    );
  }

  if (kind === "kindness") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true" className={className} fill="none">
        <path
          d="M32 51S11 39 11 24.5C11 17 16.5 13 22 13c4 0 7.5 2.2 10 6 2.5-3.8 6-6 10-6 5.5 0 11 4 11 11.5C53 39 32 51 32 51z"
          fill="#f97316"
        />
      </svg>
    );
  }

  return null;
}

function SessionPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"choose" | "prompt" | "mood" | "done">(
    "choose",
  );
  const [mode, setMode] = useState<"regular" | "brain-break">("regular");
  const [mood, setMood] = useState<number | null>(null);
  const [moodBefore, setMoodBefore] = useState<number | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [childName, setChildName] = useState<string | null>(null);
  const [kind, setKind] = useState<PromptKind | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [isPromptSaved, setIsPromptSaved] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [doneCardUrl, setDoneCardUrl] = useState<string | null>(null);
  const [milestoneThreshold, setMilestoneThreshold] = useState<number | null>(
    null,
  );
  const [showBrainBreakNudge, setShowBrainBreakNudge] = useState(false);
  const [brainBreakSoundMode, setBrainBreakSoundMode] =
    useState<BrainBreakSoundMode>("quiet");
  const [brainBreakStep, setBrainBreakStep] = useState(-1);
  const [brainBreakSteps, setBrainBreakSteps] = useState<BrainBreakStep[]>(
    defaultBrainBreakSteps.map((item) => ({ instruction: item.instruction })),
  );
  const [brainBreakShowFinishActions, setBrainBreakShowFinishActions] =
    useState(false);
  const [brainBreakLogged, setBrainBreakLogged] = useState(false);
  const [showTogetherBanner, setShowTogetherBanner] = useState(false);
  const [firstTogetherSession, setFirstTogetherSession] = useState(false);
  const [showTogetherDoneCopy, setShowTogetherDoneCopy] = useState(false);
  const [specialContext, setSpecialContext] = useState<SpecialContext | null>(null);
  const brainBreakAudioContextRef = useRef<AudioContext | null>(null);
  const brainBreakOscillatorRef = useRef<OscillatorNode | null>(null);
  const brainBreakGainRef = useRef<GainNode | null>(null);

  const accentByStep: Record<
    "choose" | "prompt" | "mood" | "done",
    string
  > = {
    choose: "#66cccc",
    prompt: "#66cccc",
    mood: "#66cccc",
    done: "#66cccc",
  };

  const isSignedIn = Boolean(userId);

  function stopBrainBreakTone() {
    try {
      brainBreakOscillatorRef.current?.stop();
    } catch {
      // ignore stop errors for already-stopped nodes
    }
    brainBreakOscillatorRef.current?.disconnect();
    brainBreakGainRef.current?.disconnect();
    if (brainBreakAudioContextRef.current) {
      void brainBreakAudioContextRef.current.close();
    }
    brainBreakOscillatorRef.current = null;
    brainBreakGainRef.current = null;
    brainBreakAudioContextRef.current = null;
  }

  function startBrainBreakTone() {
    if (brainBreakAudioContextRef.current) return;
    if (typeof window === "undefined") return;
    const WebAudio =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!WebAudio) return;
    const ctx = new WebAudio();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 56;
    gain.gain.value = 0.016;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    brainBreakAudioContextRef.current = ctx;
    brainBreakOscillatorRef.current = oscillator;
    brainBreakGainRef.current = gain;
  }

  useEffect(() => {
    async function loadUser() {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
      if (data.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();
        if (typeof profile?.child_name === "string" && profile.child_name.trim()) {
          setChildName(profile.child_name.trim());
        }
        const { data: stepsData } = await supabase
          .from("brain_break_steps")
          .select("step_number, instruction")
          .order("step_number", { ascending: true });
        const normalized = (stepsData ?? [])
          .map((row) => ({
            step: Number((row as { step_number?: number }).step_number ?? 0),
            instruction: String(
              (row as { instruction?: string }).instruction ?? "",
            ).trim(),
          }))
          .filter((row) => row.step >= 1 && row.step <= 6 && row.instruction);
        if (normalized.length === 6) {
          normalized.sort((a, b) => a.step - b.step);
          setBrainBreakSteps(
            normalized.map((row) => ({ instruction: row.instruction })),
          );
        }
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShowTogetherBanner(window.sessionStorage.getItem(togetherBannerKey) === "1");
    setFirstTogetherSession(
      window.sessionStorage.getItem(togetherSessionKey) === "1",
    );
  }, []);

  const loadSpecialPromptFromRoute = useCallback(async () => {
    if (!supabase) return;
    const routeSpecialType = searchParams.get("specialType");
    const routeSpecialKey = searchParams.get("specialKey");
    const routePromptId = searchParams.get("promptId");
    if (
      (routeSpecialType !== "seasonal" && routeSpecialType !== "weekly") ||
      !routeSpecialKey
    ) {
      return;
    }

    const now = new Date();
    setLoadingPrompt(true);
    try {
      const [{ data: seasonalRows }, { data: promptRows }] = await Promise.all([
        supabase
          .from("seasonal_windows")
          .select("*")
          .eq("active", true),
        supabase
          .from("special_prompts")
          .select("*")
          .eq("status", "active"),
      ]);

      const seasonal = (seasonalRows ?? []) as SeasonalWindowRow[];
      const prompts = (promptRows ?? []) as SpecialPromptRow[];
      let nextContext: SpecialContext | null = null;

      if (routeSpecialType === "seasonal") {
        const activeWindow = getActiveSeasonalWindow(
          seasonal.filter((item) => item.key === routeSpecialKey),
          now,
        );
        if (!activeWindow) return;
        const selectedPrompt =
          prompts.find(
            (item) =>
              item.id === routePromptId &&
              item.special_type === "seasonal" &&
              item.special_key === routeSpecialKey,
          ) ?? pickSeasonalPrompt(prompts, routeSpecialKey, now);
        if (!selectedPrompt) return;
        nextContext = buildSeasonalContext(activeWindow, selectedPrompt);
      } else {
        const activeKey = getActiveWeeklyKey(now);
        if (activeKey !== routeSpecialKey) return;
        const selectedPrompt =
          prompts.find(
            (item) =>
              item.id === routePromptId &&
              item.special_type === "weekly" &&
              item.special_key === routeSpecialKey,
          ) ?? pickWeeklyPrompt(prompts, routeSpecialKey, now);
        if (!selectedPrompt) return;
        nextContext = buildWeeklyContext(activeKey, selectedPrompt);
      }

      if (!nextContext) return;
      setSpecialContext(nextContext);
      setKind(null);
      setPrompt({
        id: nextContext.prompt.id,
        title: nextContext.prompt.name,
        body: nextContext.prompt.body,
        step: nextContext.prompt.tiny_step,
      });
      setStep("prompt");
    } finally {
      setLoadingPrompt(false);
    }
  }, [searchParams]);

  useEffect(() => {
    void loadSpecialPromptFromRoute();
  }, [loadSpecialPromptFromRoute]);

  const loadFavoriteFromRoute = useCallback(async () => {
    if (!supabase) return;
    const favoriteId = searchParams.get("favorite");
    if (!favoriteId || !userId) return;
    setLoadingPrompt(true);
    try {
      const favorite = await getFavorite(supabase, userId, favoriteId);
      if (!favorite) return;
      const validKinds: PromptKind[] = [
        "pause",
        "letting-go",
        "reflect",
        "kindness",
      ];
      const resolvedKind =
        favorite.kind && validKinds.includes(favorite.kind as PromptKind)
          ? (favorite.kind as PromptKind)
          : null;
      setSpecialContext(null);
      setKind(resolvedKind);
      setPrompt({
        id: favorite.sourceId ?? favorite.id,
        title: favorite.title,
        body: favorite.body,
        step: favorite.step,
      });
      setIsPromptSaved(true);
      setStep("prompt");
    } finally {
      setLoadingPrompt(false);
    }
  }, [searchParams, userId]);

  useEffect(() => {
    void loadFavoriteFromRoute();
  }, [loadFavoriteFromRoute]);

  useEffect(() => {
    if (!supabase || !userId) return;
    void migrateLocalFavorites(supabase, userId);
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(firstVisitKey)) {
      setIsFirstVisit(true);
      window.localStorage.setItem(firstVisitKey, "1");
    }
  }, []);

  useEffect(() => {
    if (mode !== "regular" || step !== "choose") {
      setShowBrainBreakNudge(false);
      return;
    }
    const timeout = window.setTimeout(() => {
      setShowBrainBreakNudge(true);
    }, 10_000);
    return () => window.clearTimeout(timeout);
  }, [mode, step]);

  const recordBrainBreakCompletion = useCallback(async () => {
    if (brainBreakLogged) return;
    setBrainBreakLogged(true);
    if (!supabase || !userId) return;
    try {
      const completedAt = new Date().toISOString();
      await supabase.from("sessions").insert({
        user_id: userId,
        mood_after: null,
        completed_at: completedAt,
      });
      await supabase.from("moments").insert({
        user_id: userId,
        created_at: completedAt,
        category: "brain-break",
        prompt_name: "Brain Break",
        mood_value: null,
        card_type: "moment",
      });
    } catch (error) {
      console.error("Error recording brain break", error);
    }
  }, [brainBreakLogged, userId]);

  useEffect(() => {
    if (mode !== "brain-break" || brainBreakStep !== 5) return;
    const timeout = window.setTimeout(() => {
      setBrainBreakShowFinishActions(true);
      void recordBrainBreakCompletion();
    }, 3000);
    return () => window.clearTimeout(timeout);
  }, [mode, brainBreakStep, recordBrainBreakCompletion]);

  useEffect(() => {
    return () => stopBrainBreakTone();
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
          .eq("status", "active")
          .limit(200);

        if (!error && data && data.length > 0) {
          const choice = pickFreshPrompt(data);
          rememberPromptId(choice.id);
          setPrompt({
            id: choice.id,
            title: choice.title,
            body: choice.body,
            step: choice.step,
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

    const momentCreatedAt = new Date().toISOString();

    // Save the moment (the timeline card) first and on its own, so it is never
    // blocked by an issue with the sessions write.
    try {
      await supabase.from("moments").insert({
        user_id: userId,
        created_at: momentCreatedAt,
        category: specialContext
          ? specialContext.badgeLabel
          : kind
            ? kindLabels[kind]
            : "Mindful moment",
        prompt_name: prompt?.title ?? "Tiny pause",
        mood_value: selectedMood,
        card_type: "moment",
        special_type: specialContext?.type ?? null,
        special_key: specialContext?.key ?? null,
      });
    } catch (error) {
      console.error("Error recording moment", error);
    }

    // Personal milestone check: count this user's pauses (brain breaks excluded)
    // and celebrate when the total lands exactly on a threshold.
    try {
      const { count } = await supabase
        .from("moments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .neq("category", "brain-break");
      const hit = personalMilestoneForCount(count ?? 0);
      if (hit) setMilestoneThreshold(hit);
    } catch (error) {
      console.error("Error checking milestone", error);
    }

    try {
      await supabase.from("sessions").insert({
        user_id: userId,
        mood_before: moodBefore,
        mood_after: selectedMood,
        completed_at: momentCreatedAt,
      });
    } catch (error) {
      console.error("Error recording session", error);
    }
  }

  function goToStep(target: "choose" | "prompt" | "mood" | "done") {
    setStep(target);
  }

  async function selectPromptKind(selected: PromptKind) {
    setSpecialContext(null);
    setKind(selected);
    await loadPromptForKind(selected);
    setStep("prompt");
  }

  function startBrainBreak() {
    setMode("brain-break");
    setBrainBreakStep(-1);
    setBrainBreakShowFinishActions(false);
    setBrainBreakLogged(false);
    setShowBrainBreakNudge(false);
  }

  function exitBrainBreak() {
    stopBrainBreakTone();
    setMode("regular");
    setStep("choose");
    setBrainBreakStep(-1);
    setBrainBreakShowFinishActions(false);
  }

  function beginBrainBreakSequence() {
    setBrainBreakShowFinishActions(false);
    setBrainBreakStep(0);
    if (brainBreakSoundMode === "sound") {
      startBrainBreakTone();
    } else {
      stopBrainBreakTone();
    }
  }

  function advanceBrainBreakStep() {
    setBrainBreakStep((prev) => Math.min(prev + 1, 5));
  }

  function handleBrainBreakDoneAction() {
    stopBrainBreakTone();
    setMode("regular");
    setStep("choose");
    setBrainBreakStep(-1);
    setBrainBreakShowFinishActions(false);
  }

  function handleBrainBreakExitAction() {
    stopBrainBreakTone();
    if (userId) {
      router.push("/dashboard");
      return;
    }
    router.push("/");
  }

  function startAnotherRound() {
    setMood(null);
    setMoodBefore(null);
    setKind(null);
    setPrompt(null);
    setLoadingPrompt(false);
    setIsPromptSaved(false);
    setShowTogetherDoneCopy(false);
    setSpecialContext(null);
    setMilestoneThreshold(null);
    setStep("choose");
  }

  function keepThisMoment() {
    router.push("/login");
  }

  function storePendingMoment(selectedMood: number | null) {
    if (typeof window === "undefined" || userId) return;
    const pendingMoment = {
      prompt_name: prompt?.title ?? "Tiny pause",
      category: specialContext
        ? specialContext.badgeLabel
        : kind
          ? kindLabels[kind]
          : "Mindful moment",
      mood_value: selectedMood,
      created_at: new Date().toISOString(),
    };
    window.localStorage.setItem(pendingMomentKey, JSON.stringify(pendingMoment));
  }

  function completeRegularSession(selectedMood: number | null) {
    if (firstTogetherSession && typeof window !== "undefined") {
      setShowTogetherDoneCopy(true);
      setFirstTogetherSession(false);
      setShowTogetherBanner(false);
      window.sessionStorage.removeItem(togetherSessionKey);
      window.sessionStorage.removeItem(togetherBannerKey);
    }
    setMilestoneThreshold(null);
    storePendingMoment(selectedMood);
    recordSession(selectedMood);
    setStep("done");
  }

  function dismissTogetherBanner() {
    setShowTogetherBanner(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(togetherBannerKey);
    }
  }

  async function saveCurrentPrompt() {
    if (!prompt) return;

    if (supabase && userId) {
      try {
        await saveFavorite(supabase, userId, {
          id: prompt.id,
          kind,
          title: prompt.title,
          body: prompt.body,
          step: prompt.step,
        });
        setIsPromptSaved(true);
      } catch (error) {
        console.error("Could not save favorite prompt", error);
      }
      return;
    }

    // Defensive fallback if there is no session (Save is normally signed-in only).
    try {
      const current: FavoritePrompt[] = JSON.parse(
        window.localStorage.getItem("tinyPause.favoritePrompts") ??
          window.localStorage.getItem("practice.favoritePrompts") ??
          "[]",
      ) as FavoritePrompt[];

      if (current.some((p) => p.id === prompt.id)) {
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

  function closeShareModal() {
    if (shareImageUrl) URL.revokeObjectURL(shareImageUrl);
    setShareImageUrl(null);
    setShowShareModal(false);
  }

  const buildCurrentMomentMetadata = useCallback(
    (): MomentCardMetadata =>
      milestoneThreshold
        ? {
            type: "moment",
            category: "Milestone",
            promptName: prompt?.title ?? "Tiny pause",
            moodValue: mood,
            specialType: "milestone",
            specialKey: null,
            illustrationKey: "star",
            milestoneCount: milestoneThreshold,
          }
        : {
            type: "moment",
            category: specialContext
              ? specialContext.badgeLabel
              : kind
                ? kindLabels[kind]
                : "Mindful moment",
            promptName: prompt?.title ?? "Tiny pause",
            moodValue: mood,
            specialType: specialContext?.type ?? null,
            specialKey: specialContext?.key ?? null,
            illustrationKey: specialContext?.illustrationKey ?? null,
          },
    [specialContext, kind, prompt, mood, milestoneThreshold],
  );

  useEffect(() => {
    if (step !== "done") {
      setDoneCardUrl(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      await preloadCardAssets();
      if (cancelled) return;
      const canvas = renderCardCanvas(buildCurrentMomentMetadata(), 720);
      setDoneCardUrl(canvas ? canvas.toDataURL("image/png") : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [step, buildCurrentMomentMetadata]);

  async function handleShareMoment() {
    if (shareLoading) return;
    setShareLoading(true);
    try {
      let metadata: MomentCardMetadata = buildCurrentMomentMetadata();
      if (supabase && userId && !milestoneThreshold) {
        const { data: latestMoment } = await supabase
          .from("moments")
          .select("category, prompt_name, mood_value, special_type, special_key")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestMoment) {
          metadata = {
            type: "moment",
            category: latestMoment.category ?? metadata.category,
            promptName: latestMoment.prompt_name ?? metadata.promptName,
            moodValue: latestMoment.mood_value ?? metadata.moodValue ?? null,
            specialType: latestMoment.special_type ?? metadata.specialType ?? null,
            specialKey: latestMoment.special_key ?? metadata.specialKey ?? null,
            illustrationKey: specialContext?.illustrationKey ?? null,
          };
        }
      }

      const blob = await renderCardBlob(metadata, 1080);
      if (!blob) throw new Error("Canvas rendering unavailable.");
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
          title: "Tiny Pauses",
          text: "I just took a two-minute tiny pause. Try your own:",
          url: "https://tinypauses.com",
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

  const seasonMotifColor = getSeasonalPalette(new Date()).motif;
  const moodShift = moodShiftMessage(moodBefore, mood);
  const canShareMoment = milestoneThreshold
    ? true
    : isSignedIn
      ? specialContext?.shareable !== false
      : true;

  return (
    <PageShell maxWidth="md">
      <div
        style={
          {
            "--color-accent":
              mode === "brain-break"
                ? brainBreakAccent
                : specialContext && step !== "choose"
                  ? specialContext.accentColor
                  : accentByStep[step],
          } as CSSProperties
        }
        className="space-y-5"
      >
        {mode === "regular" ? (
          <>
        <header className="text-center space-y-1.5">
          {step !== "choose" && (
            <p className="inline-flex items-center rounded-[var(--radius-pill)] bg-[color:var(--color-accent-soft)] px-4 py-1 text-xs font-medium tracking-wide text-[color:var(--color-ink-on-accent-soft)] shadow-sm ring-1 ring-[color:var(--color-accent)]/30 backdrop-blur">
              {specialContext
                ? specialContext.badgeLabel
                : kind
                  ? kindLabels[kind]
                  : "Mindful moment"}
            </p>
          )}
          <h1 className="mt-1 text-2xl font-semibold leading-tight text-[color:var(--color-primary)]">
            {step === "choose" && "What do you want help with today?"}
            {step === "prompt" && "Try this tiny pause"}
            {step === "mood" && "How do you feel now?"}
            {step === "done" &&
              (showTogetherDoneCopy
                ? "You just took a tiny pause together. That's a really good start."
                : milestoneThreshold
                  ? milestoneThreshold === 1
                    ? "You just took your very first tiny pause."
                    : `That's ${milestoneThreshold.toLocaleString()} tiny pauses. Look at you go.`
                  : specialContext
                    ? `You just took a ${specialContext.name.toLowerCase()} pause.`
                    : "You just took a tiny pause.")}
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
          {showTogetherBanner && (
            <div className="mb-3 flex items-start justify-between gap-3 rounded-xl bg-[#66cccc] px-3 py-2 text-xs text-white">
              <p>
                This one&apos;s for you and {childName ?? "your kid"} together.
                Pick whatever feels right.
              </p>
              <button
                type="button"
                onClick={dismissTogetherBanner}
                className="rounded-full px-1 text-white/90 hover:bg-white/10"
                aria-label="Dismiss together banner"
              >
                ×
              </button>
            </div>
          )}
          {isFirstVisit && (
            <p className="mb-3 rounded-xl bg-[color:var(--color-surface-soft)] px-3 py-2 text-xs text-[color:var(--color-foreground)]/80">
              New here? A tiny pause takes about two minutes. There is no wrong
              way to do it.
            </p>
          )}
          <div className="mb-4">
            <p className="text-sm text-[color:var(--color-foreground)]/85">
              How are you feeling right now?{" "}
              <span className="text-[color:var(--color-foreground)]/55">
                (optional)
              </span>
            </p>
            <div className="mt-2 flex items-stretch justify-between gap-1.5">
              {moodOptions.map((option) => {
                const selected = moodBefore === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-label={option.label}
                    aria-pressed={selected}
                    title={option.label}
                    onClick={() =>
                      setMoodBefore(selected ? null : option.value)
                    }
                    className={`flex flex-1 items-center justify-center rounded-xl border px-1 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] ${
                      selected
                        ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-ink-on-accent-soft)]"
                        : "border-[color:var(--color-border-subtle)] text-[color:var(--color-foreground)]/70 hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-surface-soft)]"
                    }`}
                  >
                    <MoodFace level={option.value} />
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-sm text-[color:var(--color-foreground)]/85">
            {moodBefore !== null && moodBefore <= 2
              ? "Pick what feels right. These two are gentle when things feel heavy:"
              : "Pick the kind of moment that would feel most helpful right now."}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {sessionKinds.map((item) => {
              const suggested =
                moodBefore !== null &&
                moodBefore <= 2 &&
                lowMoodKinds.includes(item.kind);
              return (
                <button
                  key={item.kind}
                  type="button"
                  onClick={() => selectPromptKind(item.kind)}
                  className={`rounded-2xl border bg-[color:var(--color-surface)] px-3 py-2.5 text-sm font-medium text-[color:var(--color-foreground)]/90 transition hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 ${
                    suggested
                      ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-ink-on-accent-soft)] ring-1 ring-[color:var(--color-accent)]/40"
                      : "border-[color:var(--color-border-subtle)]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={startBrainBreak}
            className="mt-3 w-full rounded-2xl border border-[#66cccc] bg-[#66cccc]/20 px-4 py-3 text-left transition hover:bg-[#66cccc]/30"
          >
            <p className="text-sm font-bold text-[#006666]">Brain Break</p>
            <p className="mt-0.5 text-xs text-[#006666]">
              Slow your brain down first.
            </p>
          </button>
          {showBrainBreakNudge && (
            <button
              type="button"
              onClick={startBrainBreak}
              className="mt-3 inline-block text-xs text-[#66cccc]/85 underline decoration-[#66cccc]/45 underline-offset-2 hover:text-[#66cccc]"
            >
              Need to slow down first?
            </button>
          )}
          <Link
            href="/"
            className="mt-3 inline-block text-xs text-[color:var(--color-foreground)]/62 transition hover:text-[color:var(--color-foreground)]/86"
          >
            Maybe later
          </Link>
          </BrandCard>
        )}

        {step === "prompt" && (
          <BrandCard>
          {loadingPrompt || !prompt ? (
            <p className="text-sm text-[color:var(--color-foreground)]/85">
              Finding a prompt…
            </p>
          ) : (
            <div className="prompt-reveal">
              <div className="flex justify-center">
                <ThemeIllustration kind={kind} />
              </div>
              <div className="mt-3 space-y-2">
                <h2 className="text-lg font-semibold text-[color:var(--color-primary)]">
                  {prompt.title}
                </h2>
                <p className="text-sm text-[color:var(--color-foreground)]/85">
                  {prompt.body}
                </p>
              </div>
              <div
                className="mt-4 rounded-2xl p-5 text-[color:var(--color-ink-on-accent-soft)] sm:p-6"
                style={{
                  backgroundColor:
                    specialContext?.type === "seasonal"
                      ? `${specialContext.accentColor}24`
                      : "var(--color-accent-soft)",
                }}
              >
                <p className="text-base font-semibold">Your tiny step</p>
                <p className="mt-2 text-base leading-relaxed">{prompt.step}</p>
              </div>
              <div className="mt-4">
                <BrandButton
                  type="button"
                  onClick={() => setStep("mood")}
                  fullWidth
                >
                  I did it
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
                <Link
                  href="/"
                  className="px-1 py-1 text-[color:var(--color-foreground)]/65 hover:text-[color:var(--color-primary)]"
                >
                  Maybe later
                </Link>
              </div>
            </div>
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
                  completeRegularSession(option.value);
                }}
                className={`flex flex-col items-center rounded-2xl border bg-[color:var(--color-surface)] px-3 py-2.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 ${
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
              completeRegularSession(option.value);
            }}
            className={`mt-3 flex w-full flex-col items-center rounded-2xl border bg-[color:var(--color-surface)] px-3 py-2.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 ${
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
              completeRegularSession(null);
            }}
          >
            Skip for now
          </BrandButton>
          </BrandCard>
        )}

        {step === "done" && (
          <BrandCard tone="accent">
          <div className="space-y-4 text-center">
            {doneCardUrl ? (
              <div className="relative mx-auto w-full max-w-[244px]">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-[-18%] bottom-[-6%] top-[-24%] z-0 overflow-hidden"
                >
                  {driftMotifs.map((motif, index) => (
                    <span
                      key={index}
                      className="motif-drift absolute bottom-0 rounded-full"
                      style={{
                        left: motif.left,
                        width: `${motif.size}px`,
                        height: `${motif.size}px`,
                        backgroundColor: seasonMotifColor,
                        animationDuration: motif.duration,
                        animationDelay: motif.delay,
                      }}
                    />
                  ))}
                </div>
                <Image
                  src={doneCardUrl}
                  alt="Your tiny pause card"
                  width={720}
                  height={720}
                  unoptimized
                  className="sprout-pop relative z-10 w-full rounded-2xl border border-[color:var(--color-border-subtle)] shadow-[var(--shadow-soft)]"
                />
              </div>
            ) : (
              <p className="text-4xl">
                <span className="sprout-pop">🌱</span>
              </p>
            )}
            <p className="text-base font-medium text-[color:var(--color-ink-on-accent-soft)]">
              {(mood !== null ? moodFinishMessages[mood] : defaultFinishMessage)
                .headline}
            </p>
            <p className="text-sm text-[color:var(--color-ink-on-accent-soft)]/90">
              {(mood !== null ? moodFinishMessages[mood] : defaultFinishMessage)
                .body}
            </p>
            {moodShift && (
              <p className="mx-auto block w-fit rounded-[var(--radius-pill)] bg-[color:var(--color-surface)] px-4 py-1.5 text-xs font-medium text-[color:var(--color-ink-on-accent-soft)] shadow-sm ring-1 ring-[color:var(--color-accent)]/30">
                {moodShift}
              </p>
            )}
            <div className="flex flex-col gap-3">
              {isSignedIn ? (
                <>
                  <BrandButton type="button" onClick={startAnotherRound} fullWidth>
                    Take another pause
                  </BrandButton>
                  <div
                    className={
                      canShareMoment ? "grid grid-cols-2 gap-3" : "grid grid-cols-1"
                    }
                  >
                    <BrandButton
                      type="button"
                      variant="outlineAccent"
                      onClick={saveCurrentPrompt}
                      disabled={isPromptSaved}
                      fullWidth
                    >
                      {isPromptSaved ? "Favorited" : "Favorite"}
                    </BrandButton>
                    {canShareMoment && (
                      <BrandButton
                        type="button"
                        variant="outlineAccent"
                        onClick={handleShareMoment}
                        disabled={shareLoading}
                        fullWidth
                      >
                        {shareLoading ? "Preparing..." : "Share"}
                      </BrandButton>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <BrandButton type="button" onClick={keepThisMoment} fullWidth>
                    Keep this moment
                  </BrandButton>
                  <p className="px-1 text-center text-xs text-[color:var(--color-foreground)]/68">
                    Create a free account to save your tiny pauses and see them
                    grow over time.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <BrandButton
                      type="button"
                      variant="outlineAccent"
                      onClick={handleShareMoment}
                      disabled={shareLoading}
                      fullWidth
                    >
                      {shareLoading ? "Preparing..." : "Share"}
                    </BrandButton>
                    <BrandButton
                      type="button"
                      variant="outlineAccent"
                      onClick={startAnotherRound}
                      fullWidth
                    >
                      Try another
                    </BrandButton>
                  </div>
                </>
              )}
            </div>
            <div className="mt-1 border-t border-[color:var(--color-border-subtle)]/55 pt-3">
              <p className="text-center text-xs text-[color:var(--color-foreground)]/62">
                Get a tiny pause in your inbox every morning.{" "}
                <Link
                  href="/daily"
                  className="underline decoration-[color:var(--color-foreground)]/38 underline-offset-2 hover:text-[color:var(--color-foreground)]/86"
                >
                  Sign up free
                </Link>
              </p>
            </div>
          </div>
          </BrandCard>
        )}
        {showShareModal && shareImageUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4">
            <div className="w-full max-w-md rounded-2xl bg-[color:var(--color-surface)] p-4 shadow-[0_22px_55px_rgba(2,6,23,0.45)]">
              <Image
                src={shareImageUrl}
                alt="Share card preview"
                width={1080}
                height={1080}
                unoptimized
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
          </>
        ) : (
          <section className="relative rounded-[var(--radius-card)] border border-[#66cccc]/45 bg-[linear-gradient(180deg,#66cccc1f_0%,#66cccc14_100%)] p-4 sm:p-6">
            <button
              type="button"
              onClick={exitBrainBreak}
              className="absolute right-4 top-3 text-xs text-[#66cccc]/75 underline decoration-[#66cccc]/35 underline-offset-2 hover:text-[#66cccc]"
            >
              exit
            </button>
            <div className="mx-auto flex min-h-[66vh] max-w-md flex-col items-center justify-center text-center">
              {brainBreakStep >= 0 && (
                <div className="mb-5 w-full space-y-2">
                  <p className="text-xs font-medium tracking-wide text-[#66cccc]/80">
                    Step {brainBreakStep + 1} of 6
                  </p>
                  <div className="flex items-center gap-1.5">
                    {brainBreakSteps.map((_, idx) => (
                      <span
                        key={idx}
                        className={`h-2 flex-1 rounded-full ${
                          idx <= brainBreakStep
                            ? "bg-[#66cccc]"
                            : "bg-[#66cccc]/35"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {brainBreakStep < 0 ? (
                <div className="brain-break-fade space-y-5">
                  <h2 className="text-3xl font-semibold text-[#66cccc]">
                    Brain Break
                  </h2>
                  <p className="text-lg text-[#66cccc]/85">
                    This takes about 90 seconds. Just follow along.
                  </p>
                  <div className="mx-auto grid max-w-xs grid-cols-2 gap-2 rounded-2xl bg-white/50 p-2">
                    <button
                      type="button"
                      onClick={() => setBrainBreakSoundMode("quiet")}
                      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                        brainBreakSoundMode === "quiet"
                          ? "bg-[#66cccc] text-white"
                          : "text-[#66cccc] hover:bg-white/70"
                      }`}
                    >
                      Quiet
                    </button>
                    <button
                      type="button"
                      onClick={() => setBrainBreakSoundMode("sound")}
                      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                        brainBreakSoundMode === "sound"
                          ? "bg-[#66cccc] text-white"
                          : "text-[#66cccc] hover:bg-white/70"
                      }`}
                    >
                      With sound
                    </button>
                  </div>
                  <BrandButton type="button" onClick={beginBrainBreakSequence} fullWidth>
                    Let&apos;s go
                  </BrandButton>
                </div>
              ) : (
                <div key={brainBreakStep} className="brain-break-fade space-y-5">
                  <div className="mx-auto flex justify-center">
                    <BrainBreakStepVisual step={brainBreakStep} />
                  </div>
                  <p className="text-balance text-2xl font-semibold leading-snug text-[#66cccc]">
                    {brainBreakSteps[brainBreakStep]?.instruction}
                  </p>
                  {brainBreakStep < 5 ? (
                    <div className="pt-1">
                      <BrandButton type="button" onClick={advanceBrainBreakStep} fullWidth>
                        I did it
                      </BrandButton>
                    </div>
                  ) : brainBreakShowFinishActions ? (
                    <div className="space-y-3 pt-1">
                      <BrandButton type="button" onClick={handleBrainBreakDoneAction} fullWidth>
                        Take a tiny pause
                      </BrandButton>
                      <button
                        type="button"
                        onClick={handleBrainBreakExitAction}
                        className="text-sm text-[#66cccc]/80 underline decoration-[#66cccc]/35 underline-offset-2 hover:text-[#66cccc]"
                      >
                        I&apos;m good, thanks
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-[#66cccc]/72">Nice work. Stay here for a moment.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}

export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <PageShell maxWidth="md">
          <BrandCard tone="muted">
            <p className="text-sm text-[color:var(--color-foreground)]/80">
              Loading session...
            </p>
          </BrandCard>
        </PageShell>
      }
    >
      <SessionPageInner />
    </Suspense>
  );
}

