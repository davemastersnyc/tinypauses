"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Hands-free classroom Brain Break, built to run on a smartboard. The teacher
// touches the setup screen once, then leads the room with their body while the
// board keeps the beat. No student accounts, no logging, nothing stored.
// This is the board-mode counterpart to the per-kid flow in /session.

type Energy = "buzzing" | "tense" | "flat";
type Dose = "full" | "short" | "breath";
type Phase = "setup" | "running" | "done";

// visual maps to the same artwork the /session Brain Break uses:
// 0 shake, 1 stomp, 2 squeeze, 3 notice, 4 breath, 5 land
type BoardStep = { visual: number; text: string; seconds: number };

const TEAL = "#0e8a8a";

// A calm beat between steps (and a lead-in before the first one) so the room
// eases from one move to the next instead of being snapped along.
const REST_MS = 1700;

const energyMeta: Record<
  Energy,
  { label: string; blurb: string }
> = {
  buzzing: {
    label: "Buzzing",
    blurb: "Bodies still moving after recess. Burn it off first.",
  },
  tense: {
    label: "Tense",
    blurb: "Nerves before a test, or the room after a conflict.",
  },
  flat: {
    label: "Flat",
    blurb: "Sleepy and low after lunch. A gentle wake-up.",
  },
};

const doseMeta: Record<Dose, { label: string; sub: string }> = {
  full: { label: "90 seconds", sub: "Full reset" },
  short: { label: "30 seconds", sub: "When the gap is small" },
  breath: { label: "One breath", sub: "Almost no time at all" },
};

const text = {
  shake: "Shake out your hands. Flick the water off. Arms too if you want.",
  stomp: "Stomp your feet three times. Then press them flat and hold.",
  squeeze: "Squeeze your hands into fists. Hold it... and let go.",
  notice: "Touch something near you. Cool or warm? Just notice.",
  breath: "Breathe in slow through your nose... and out through your mouth.",
  oneBreath: "One slow breath together. In through the nose... out through the mouth.",
  land: "Notice the room. Quieter than a minute ago. You did that.",
};

function buildSequence(energy: Energy, dose: Dose): BoardStep[] {
  if (dose === "breath") {
    return [
      { visual: 4, text: text.oneBreath, seconds: 12 },
      { visual: 5, text: text.land, seconds: 4 },
    ];
  }

  if (dose === "short") {
    const short: Record<Energy, BoardStep[]> = {
      buzzing: [
        { visual: 0, text: text.shake, seconds: 9 },
        { visual: 2, text: text.squeeze, seconds: 7 },
        { visual: 4, text: text.breath, seconds: 10 },
        { visual: 5, text: text.land, seconds: 4 },
      ],
      tense: [
        { visual: 2, text: text.squeeze, seconds: 8 },
        { visual: 4, text: text.breath, seconds: 18 },
        { visual: 5, text: text.land, seconds: 4 },
      ],
      flat: [
        { visual: 0, text: text.shake, seconds: 9 },
        { visual: 4, text: text.breath, seconds: 17 },
        { visual: 5, text: text.land, seconds: 4 },
      ],
    };
    return short[energy];
  }

  // full, 90 seconds. Energy decides what to front-load before the breath.
  const full: Record<Energy, BoardStep[]> = {
    // burn the movement off first, then settle
    buzzing: [
      { visual: 0, text: text.shake, seconds: 16 },
      { visual: 1, text: text.stomp, seconds: 14 },
      { visual: 2, text: text.squeeze, seconds: 12 },
      { visual: 3, text: text.notice, seconds: 10 },
      { visual: 4, text: text.breath, seconds: 30 },
      { visual: 5, text: text.land, seconds: 8 },
    ],
    // lead with a squeeze-and-release, weight the breath
    tense: [
      { visual: 2, text: text.squeeze, seconds: 12 },
      { visual: 0, text: text.shake, seconds: 10 },
      { visual: 3, text: text.notice, seconds: 8 },
      { visual: 4, text: text.breath, seconds: 46 },
      { visual: 5, text: text.land, seconds: 14 },
    ],
    // a soft rouse, then settle
    flat: [
      { visual: 0, text: text.shake, seconds: 14 },
      { visual: 1, text: text.stomp, seconds: 12 },
      { visual: 3, text: text.notice, seconds: 10 },
      { visual: 4, text: text.breath, seconds: 38 },
      { visual: 5, text: text.land, seconds: 16 },
    ],
  };
  return full[energy];
}

function BoardVisual({ visual }: { visual: number }) {
  if (visual === 0) {
    return (
      <div className="flex items-center justify-center gap-4">
        <div className="bb-hand-wiggle-left">
          <Image src="/brain-break/shake.svg" alt="" width={200} height={200} className="h-32 w-32 sm:h-44 sm:w-44" />
        </div>
        <div className="bb-hand-wiggle-right">
          <Image src="/brain-break/shake.svg" alt="" width={200} height={200} className="h-32 w-32 -scale-x-100 sm:h-44 sm:w-44" />
        </div>
      </div>
    );
  }
  if (visual === 1) {
    return (
      <div className="bb-feet-pulse">
        <Image src="/brain-break/stomp.svg" alt="" width={200} height={200} className="h-36 w-36 sm:h-48 sm:w-48" />
      </div>
    );
  }
  if (visual === 2) {
    return (
      <div className="bb-squeeze-left">
        <Image src="/brain-break/fist.svg" alt="" width={200} height={200} className="h-36 w-36 sm:h-48 sm:w-48" />
      </div>
    );
  }
  if (visual === 3) {
    return (
      <div className="bb-warm-lines">
        <Image src="/brain-break/point.svg" alt="" width={200} height={200} className="h-36 w-36 sm:h-48 sm:w-48" />
      </div>
    );
  }
  if (visual === 4) {
    return <div aria-hidden="true" className="bb-breath-orb h-48 w-48 rounded-full sm:h-60 sm:w-60" />;
  }
  return <p className="text-7xl sm:text-8xl" aria-hidden="true">🌱</p>;
}

export function BoardMode() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [energy, setEnergy] = useState<Energy>("buzzing");
  const [dose, setDose] = useState<Dose>("full");
  const [sound, setSound] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [resting, setResting] = useState(false);

  const audioRef = useRef<AudioContext | null>(null);
  const sequence = useMemo(() => buildSequence(energy, dose), [energy, dose]);

  // Refs mirror state so the metronome interval reads the latest values without
  // re-subscribing (and without stale closures) on every tick.
  const stepRef = useRef(0);
  const progressRef = useRef(0);
  const restingRef = useRef(false);
  const restElapsedRef = useRef(0);
  const soundRef = useRef(sound);
  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  const ensureAudio = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioRef.current) {
      const AC =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      audioRef.current = new AC();
    }
    if (audioRef.current.state === "suspended") void audioRef.current.resume();
    return audioRef.current;
  }, []);

  // A soft two-tone bell. The "we pause now" anchor at each step. `landing`
  // uses a lower, warmer pair to signal the close.
  const playChime = useCallback(
    (landing = false) => {
      const ctx = audioRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;
      const freqs = landing ? [330, 495] : [528, 792];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.07 / (i + 1), now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.7);
      });
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (audioRef.current) void audioRef.current.close();
      audioRef.current = null;
    };
  }, []);

  const beginRun = useCallback(() => {
    if (sound) ensureAudio();
    stepRef.current = 0;
    progressRef.current = 0;
    restingRef.current = true; // open on a lead-in beat, not a hard start
    restElapsedRef.current = 0;
    setStepIndex(0);
    setProgress(0);
    setResting(true);
    setPaused(false);
    setPhase("running");
  }, [sound, ensureAudio]);

  // The metronome: one interval drives the whole run. Each step counts toward
  // its duration, then hands off through a calm rest beat to the next, so the
  // room eases between moves. The teacher never clicks. setState lives in the
  // interval callback (not the effect body), so there is no cascading-render or
  // stale-step problem.
  useEffect(() => {
    if (phase !== "running" || paused) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = now - last;
      last = now;

      // Resting between steps: hold, then bring the next instruction in with a
      // chime as it appears.
      if (restingRef.current) {
        restElapsedRef.current += dt;
        if (restElapsedRef.current >= REST_MS) {
          restingRef.current = false;
          progressRef.current = 0;
          setResting(false);
          setProgress(0);
          if (soundRef.current) playChime();
        }
        return;
      }

      const step = sequence[stepRef.current];
      if (!step) return;
      progressRef.current += dt / (step.seconds * 1000);
      if (progressRef.current >= 1) {
        if (stepRef.current < sequence.length - 1) {
          stepRef.current += 1;
          restingRef.current = true;
          restElapsedRef.current = 0;
          setStepIndex(stepRef.current);
          setResting(true);
          setProgress(0);
        } else {
          setProgress(1);
          setPhase("done");
          if (soundRef.current) playChime(true);
        }
        return;
      }
      setProgress(progressRef.current);
    }, 50);
    return () => window.clearInterval(id);
  }, [phase, paused, sequence, playChime]);

  // Keyboard for the teacher at the board: space pauses, escape leaves.
  useEffect(() => {
    if (phase !== "running") return;
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (e.key === "Escape") {
        setPhase("setup");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  if (phase === "setup") {
    return (
      <main className="min-h-screen bg-[radial-gradient(140%_120%_at_50%_0%,#f4fbfb_0%,#e4f4f4_55%,#d3eded_100%)] px-5 py-8">
        <div className="mx-auto w-full max-w-3xl space-y-8">
          <header className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[#ffd84a]/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a6a00]">
                Preview
              </span>
              <Link
                href="/for-classrooms"
                className="text-xs text-[color:var(--color-foreground)]/55 underline underline-offset-2 hover:text-[color:var(--color-foreground)]"
              >
                Back
              </Link>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--color-primary)] sm:text-4xl">
              Classroom Brain Break
            </h1>
            <p className="max-w-xl text-base leading-7 text-[color:var(--color-foreground)]/80">
              Put this on the board and lead it with your body. The board keeps
              the beat, so you do not have to click through anything. Pick where
              the room is right now, then go.
            </p>
          </header>

          <section className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-[color:var(--color-foreground)]/55">
              Where is the room?
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {(Object.keys(energyMeta) as Energy[]).map((key) => {
                const active = energy === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEnergy(key)}
                    aria-pressed={active}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      active
                        ? "border-[#0e8a8a] bg-white shadow-[0_10px_30px_rgba(14,138,138,0.18)]"
                        : "border-[color:var(--color-border-subtle)] bg-white/60 hover:bg-white"
                    }`}
                  >
                    <span className="block text-lg font-semibold text-[#065f5f]">
                      {energyMeta[key].label}
                    </span>
                    <span className="mt-1 block text-sm leading-snug text-[color:var(--color-foreground)]/70">
                      {energyMeta[key].blurb}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-[color:var(--color-foreground)]/55">
                How much time?
              </p>
              <div className="space-y-2">
                {(Object.keys(doseMeta) as Dose[]).map((key) => {
                  const active = dose === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDose(key)}
                      aria-pressed={active}
                      className={`flex w-full items-baseline justify-between rounded-xl border px-4 py-3 text-left transition ${
                        active
                          ? "border-[#0e8a8a] bg-white"
                          : "border-[color:var(--color-border-subtle)] bg-white/60 hover:bg-white"
                      }`}
                    >
                      <span className="font-semibold text-[#065f5f]">
                        {doseMeta[key].label}
                      </span>
                      <span className="text-xs text-[color:var(--color-foreground)]/60">
                        {doseMeta[key].sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-[color:var(--color-foreground)]/55">
                Sound
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSound(false)}
                  aria-pressed={!sound}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    !sound
                      ? "border-[#0e8a8a] bg-white text-[#065f5f]"
                      : "border-[color:var(--color-border-subtle)] bg-white/60 text-[color:var(--color-foreground)]/70 hover:bg-white"
                  }`}
                >
                  Quiet
                </button>
                <button
                  type="button"
                  onClick={() => setSound(true)}
                  aria-pressed={sound}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    sound
                      ? "border-[#0e8a8a] bg-white text-[#065f5f]"
                      : "border-[color:var(--color-border-subtle)] bg-white/60 text-[color:var(--color-foreground)]/70 hover:bg-white"
                  }`}
                >
                  Soft chime
                </button>
              </div>
              <p className="text-xs leading-relaxed text-[color:var(--color-foreground)]/55">
                {`Quiet by default, so it works during a test next door. The chime is a gentle "we pause now" cue at each step.`}
              </p>
            </div>
          </section>

          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={beginRun}
              className="w-full rounded-[var(--radius-pill)] bg-[#0e8a8a] px-6 py-4 text-lg font-semibold text-white shadow-[0_14px_34px_rgba(14,138,138,0.28)] transition hover:bg-[#0b7575] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e8a8a] focus-visible:ring-offset-2"
            >
              Start the break
            </button>
            <p className="text-center text-xs leading-relaxed text-[color:var(--color-foreground)]/55">
              Early preview. Run it once on your own first, so the first time in
              front of the class is not cold.{" "}
              <Link
                href="/for-classrooms"
                className="underline underline-offset-2 hover:text-[color:var(--color-foreground)]"
              >
                Help shape it
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (phase === "done") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(140%_120%_at_50%_30%,#0e8a8a_0%,#0b6e6e_60%,#075454_100%)] px-6 text-center">
        <div className="brain-break-fade max-w-2xl space-y-6">
          <p className="text-7xl sm:text-8xl" aria-hidden="true">🌱</p>
          <h1 className="text-balance text-4xl font-semibold leading-tight text-white sm:text-5xl">
            The room just reset.
          </h1>
          <p className="text-balance text-xl leading-relaxed text-white/85 sm:text-2xl">
            Before you move on, notice one good thing in the room right now.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={beginRun}
              className="rounded-[var(--radius-pill)] bg-white px-7 py-3.5 text-base font-semibold text-[#065f5f] shadow-lg transition hover:bg-white/90"
            >
              Run it again
            </button>
            <button
              type="button"
              onClick={() => setPhase("setup")}
              className="rounded-[var(--radius-pill)] border border-white/40 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Change settings
            </button>
          </div>
          <Link
            href="/for-classrooms"
            className="inline-block pt-1 text-sm text-white/70 underline underline-offset-2 hover:text-white"
          >
            Leave the board
          </Link>
        </div>
      </main>
    );
  }

  // running
  const step = sequence[stepIndex];
  const circumference = 2 * Math.PI * 46;
  const dashOffset = circumference * progress;

  return (
    <main className="relative flex min-h-screen flex-col bg-[radial-gradient(140%_120%_at_50%_18%,#f4fbfb_0%,#e2f3f3_55%,#cfeaea_100%)] px-5 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#065f5f]">Brain Break</span>
          <span className="inline-flex items-center rounded-full bg-[#0e8a8a]/12 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#0e8a8a]">
            Preview
          </span>
        </div>
        <div aria-hidden="true" className="hidden flex-1 items-center gap-1.5 px-6 sm:flex">
          {sequence.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 flex-1 rounded-full ${
                idx < stepIndex
                  ? "bg-[#0e8a8a]"
                  : idx === stepIndex
                    ? "bg-[#0e8a8a]/55"
                    : "bg-[#0e8a8a]/20"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="rounded-full border border-[#0e8a8a]/30 bg-white/70 px-4 py-1.5 text-sm font-medium text-[#065f5f] transition hover:bg-white"
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={() => setPhase("setup")}
            className="rounded-full border border-[#0e8a8a]/30 bg-white/70 px-3 py-1.5 text-sm font-medium text-[#065f5f] transition hover:bg-white"
            aria-label="Exit"
          >
            Exit
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 sm:gap-12">
        <div
          className="relative flex items-center justify-center"
          style={{ width: "clamp(220px, 44vmin, 440px)", height: "clamp(220px, 44vmin, 440px)" }}
        >
          <svg
            className="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle cx="50" cy="50" r="46" fill="none" stroke={TEAL} strokeOpacity="0.14" strokeWidth="3" />
            {!resting && (
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke={TEAL}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 80ms linear" }}
              />
            )}
          </svg>
          <div className="flex h-[78%] w-[78%] items-center justify-center rounded-full bg-white/75 shadow-[inset_0_0_60px_rgba(14,138,138,0.06)]">
            {resting ? (
              <div
                key="rest"
                aria-hidden="true"
                className="board-rest-dot h-24 w-24 rounded-full sm:h-32 sm:w-32"
              />
            ) : (
              <div key={stepIndex} className="board-step-enter flex items-center justify-center">
                <BoardVisual visual={step.visual} />
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-[4.5rem] items-center justify-center sm:min-h-[7.5rem]">
          {!resting && (
            <p
              key={stepIndex}
              className="board-step-enter max-w-4xl text-balance px-2 text-center text-3xl font-semibold leading-snug text-[#065f5f] sm:text-5xl"
            >
              {step.text}
            </p>
          )}
        </div>
      </div>

      <p className="text-center text-xs uppercase tracking-wide text-[#065f5f]/45">
        {energyMeta[energy].label} · {doseMeta[dose].label}
        {paused ? " · paused" : ""}
      </p>
    </main>
  );
}
