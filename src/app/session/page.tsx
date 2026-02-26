"use client";

import {
  Suspense,
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { type MomentCardMetadata, renderCardBlob } from "@/lib/cardRenderer";
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

const brainBreakAccent = "#5caec3";

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
const keepMomentIntentKey = "tinyPauses.keepMomentIntent";

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
      <svg viewBox="0 0 180 120" aria-hidden="true" className="h-36 w-52 text-[#5caec3]">
        <path
          className="bb-hand-wiggle-left"
          d="M38 80c0-10 4-18 10-23V35c0-4 6-4 6 0v17h4V30c0-4 6-4 6 0v22h4V33c0-4 6-4 6 0v24h4V40c0-4 6-4 6 0v28c3 3 5 7 5 12 0 12-10 22-22 22H60c-12 0-22-10-22-22Z"
          fill="currentColor"
          fillOpacity="0.17"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          className="bb-hand-wiggle-right"
          d="M142 80c0-10-4-18-10-23V35c0-4-6-4-6 0v17h-4V30c0-4-6-4-6 0v22h-4V33c0-4-6-4-6 0v24h-4V40c0-4-6-4-6 0v28c-3 3-5 7-5 12 0 12 10 22 22 22h16c12 0 22-10 22-22Z"
          fill="currentColor"
          fillOpacity="0.17"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (step === 1) {
    return (
      <svg viewBox="0 0 180 120" aria-hidden="true" className="h-36 w-52 text-[#4f94ab]">
        <rect x="18" y="92" width="144" height="8" rx="4" fill="currentColor" fillOpacity="0.22" />
        <g className="bb-feet-pulse">
          <path
            d="M44 88c0-14 9-26 20-26 10 0 18 11 18 24v2H44Z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M98 88c0-14 9-26 20-26 10 0 18 11 18 24v2H98Z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="2"
          />
        </g>
      </svg>
    );
  }

  if (step === 2) {
    return (
      <svg viewBox="0 0 180 120" aria-hidden="true" className="h-36 w-52 text-[#599fb4]">
        <g className="bb-squeeze-left" transform="translate(34 30)">
          <path
            d="M8 56c0-8 5-14 11-17v-10c0-4 5-4 5 0v8h4v-11c0-4 5-4 5 0v11h4v-10c0-4 5-4 5 0v12h4v-8c0-4 5-4 5 0v16c2 3 4 6 4 10 0 10-8 18-18 18H26C16 74 8 66 8 56Z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="2"
          />
        </g>
        <g className="bb-squeeze-right" transform="translate(90 30)">
          <path
            d="M8 56c0-8 5-14 11-17v-10c0-4 5-4 5 0v8h4v-11c0-4 5-4 5 0v11h4v-10c0-4 5-4 5 0v12h4v-8c0-4 5-4 5 0v16c2 3 4 6 4 10 0 10-8 18-18 18H26C16 74 8 66 8 56Z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="2"
          />
        </g>
      </svg>
    );
  }

  if (step === 3) {
    return (
      <svg viewBox="0 0 180 120" aria-hidden="true" className="h-36 w-52 text-[#5daabf]">
        <rect x="24" y="74" width="132" height="12" rx="6" fill="currentColor" fillOpacity="0.25" />
        <path
          d="M70 76c0-14 7-31 18-31 9 0 13 11 13 22v9H70Z"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path className="bb-warm-lines" d="M113 47v11m10-6v11m10-6v11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (step === 4) {
    return <div aria-hidden="true" className="bb-breath-orb h-36 w-36 rounded-full" />;
  }

  return <p className="text-6xl" aria-hidden="true">🌱</p>;
}

function SessionPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"choose" | "prompt" | "mood" | "done">(
    "choose",
  );
  const [mode, setMode] = useState<"regular" | "brain-break">("regular");
  const [mood, setMood] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [childName, setChildName] = useState<string | null>(null);
  const [kind, setKind] = useState<PromptKind | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [isPromptSaved, setIsPromptSaved] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
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
    choose: "#25e0c5", // teal
    prompt: "#ff2f92", // pink
    mood: "#ffd84a", // yellow
    done: "#9f7fff", // purple
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
      const momentCreatedAt = new Date().toISOString();
      await supabase.from("sessions").insert({
        user_id: userId,
        mood_after: selectedMood,
        completed_at: momentCreatedAt,
      });
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
    setKind(null);
    setPrompt(null);
    setLoadingPrompt(false);
    setIsPromptSaved(false);
    setShowTogetherDoneCopy(false);
    setSpecialContext(null);
    setStep("choose");
  }

  function keepThisMoment() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(keepMomentIntentKey, "1");
    }
    router.push("/login");
  }

  function completeRegularSession(selectedMood: number | null) {
    if (firstTogetherSession && typeof window !== "undefined") {
      setShowTogetherDoneCopy(true);
      setFirstTogetherSession(false);
      setShowTogetherBanner(false);
      window.sessionStorage.removeItem(togetherSessionKey);
      window.sessionStorage.removeItem(togetherBannerKey);
    }
    recordSession(selectedMood);
    setStep("done");
  }

  function dismissTogetherBanner() {
    setShowTogetherBanner(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(togetherBannerKey);
    }
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

  function closeShareModal() {
    if (shareImageUrl) URL.revokeObjectURL(shareImageUrl);
    setShareImageUrl(null);
    setShowShareModal(false);
  }

  async function handleShareMoment() {
    if (shareLoading) return;
    setShareLoading(true);
    try {
      let metadata: MomentCardMetadata = {
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
      };
      if (supabase && userId) {
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
            <div className="mb-3 flex items-start justify-between gap-3 rounded-xl bg-[#4ea6be] px-3 py-2 text-xs text-white">
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
          <p className="text-sm text-[color:var(--color-foreground)]/85">
            Pick the kind of moment that would feel most helpful right now.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => selectPromptKind("pause")}
              className="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm font-medium text-[color:var(--color-foreground)]/90 transition hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-surface-soft)]"
            >
              Just a pause
            </button>
            <button
              type="button"
              onClick={() => selectPromptKind("letting-go")}
              className="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm font-medium text-[color:var(--color-foreground)]/90 transition hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-surface-soft)]"
            >
              Letting go
            </button>
            <button
              type="button"
              onClick={() => selectPromptKind("reflect")}
              className="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm font-medium text-[color:var(--color-foreground)]/90 transition hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-surface-soft)]"
            >
              Reflecting on today
            </button>
            <button
              type="button"
              onClick={() => selectPromptKind("kindness")}
              className="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm font-medium text-[color:var(--color-foreground)]/90 transition hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-surface-soft)]"
            >
              Kindness
            </button>
          </div>
          <button
            type="button"
            onClick={startBrainBreak}
            className="mt-3 w-full rounded-2xl border border-[#8ac8d5] bg-[#eaf7fb] px-4 py-3 text-left transition hover:bg-[#dff1f6]"
          >
            <p className="text-sm font-semibold text-[#2c6e83]">Brain Break</p>
            <p className="mt-0.5 text-xs text-[#2c6e83]/80">
              Slow your brain down first.
            </p>
          </button>
          {showBrainBreakNudge && (
            <button
              type="button"
              onClick={startBrainBreak}
              className="mt-3 inline-block text-xs text-[#2c6e83]/85 underline decoration-[#2c6e83]/45 underline-offset-2 hover:text-[#2c6e83]"
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
            <>
              <div className="space-y-2">
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
                  completeRegularSession(option.value);
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
              completeRegularSession(option.value);
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
            <p className="text-4xl">🌱</p>
            <p className="text-base font-medium text-[color:var(--color-ink-on-accent-soft)]">
              Taking even one tiny pause like this is a big deal.
            </p>
            <p className="text-sm text-[color:var(--color-ink-on-accent-soft)]/90">
              You can come back for another moment any time you like. For now,
              notice one more thing around you that makes you feel okay or safe.
            </p>
            {(isSignedIn ? specialContext?.shareable !== false : true) && (
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
            )}
            <div className="flex flex-col gap-3">
              {isSignedIn ? (
                <>
                  <BrandButton type="button" onClick={startAnotherRound} fullWidth>
                    Try another round
                  </BrandButton>
                  <BrandButton
                    type="button"
                    variant="outlineAccent"
                    onClick={saveCurrentPrompt}
                    fullWidth
                  >
                    {isPromptSaved ? "Saved to favorites" : "Save this prompt"}
                  </BrandButton>
                  <BrandButton href="/dashboard" fullWidth>
                    Go to my dashboard
                  </BrandButton>
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
                  <BrandButton
                    type="button"
                    variant="outlineAccent"
                    onClick={startAnotherRound}
                    fullWidth
                  >
                    Try another one
                  </BrandButton>
                </>
              )}
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
          <section className="relative rounded-[var(--radius-card)] border border-[#cfe8ef] bg-[linear-gradient(180deg,#eef8fb_0%,#e5f3f7_100%)] p-4 sm:p-6">
            <button
              type="button"
              onClick={exitBrainBreak}
              className="absolute right-4 top-3 text-xs text-[#285f72]/75 underline decoration-[#285f72]/35 underline-offset-2 hover:text-[#285f72]"
            >
              exit
            </button>
            <div className="mx-auto flex min-h-[66vh] max-w-md flex-col items-center justify-center text-center">
              {brainBreakStep >= 0 && (
                <div className="mb-5 w-full space-y-2">
                  <p className="text-xs font-medium tracking-wide text-[#285f72]/80">
                    Step {brainBreakStep + 1} of 6
                  </p>
                  <div className="flex items-center gap-1.5">
                    {brainBreakSteps.map((_, idx) => (
                      <span
                        key={idx}
                        className={`h-2 flex-1 rounded-full ${
                          idx <= brainBreakStep
                            ? "bg-[#4ea6be]"
                            : "bg-[#bfdde7]"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {brainBreakStep < 0 ? (
                <div className="brain-break-fade space-y-5">
                  <h2 className="text-3xl font-semibold text-[#1f4f60]">
                    Brain Break
                  </h2>
                  <p className="text-lg text-[#1f4f60]/85">
                    This takes about 90 seconds. Just follow along.
                  </p>
                  <div className="mx-auto grid max-w-xs grid-cols-2 gap-2 rounded-2xl bg-white/50 p-2">
                    <button
                      type="button"
                      onClick={() => setBrainBreakSoundMode("quiet")}
                      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                        brainBreakSoundMode === "quiet"
                          ? "bg-[#5caec3] text-white"
                          : "text-[#285f72] hover:bg-white/70"
                      }`}
                    >
                      Quiet
                    </button>
                    <button
                      type="button"
                      onClick={() => setBrainBreakSoundMode("sound")}
                      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                        brainBreakSoundMode === "sound"
                          ? "bg-[#5caec3] text-white"
                          : "text-[#285f72] hover:bg-white/70"
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
                  <p className="text-balance text-2xl font-semibold leading-snug text-[#1f4f60]">
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
                        className="text-sm text-[#285f72]/80 underline decoration-[#285f72]/35 underline-offset-2 hover:text-[#285f72]"
                      >
                        I&apos;m good, thanks
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-[#285f72]/72">Nice work. Stay here for a moment.</p>
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

