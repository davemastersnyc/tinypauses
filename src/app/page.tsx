"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { BrandButton, BrandCard, BrandPill, PageShell } from "./ui";
import { Testimonials } from "./testimonials";

function KidsIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="h-8 w-8 text-[#66cccc]"
      fill="none"
    >
      <circle cx="13" cy="10" r="4.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6.5 24c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M24.5 5.5l.9 2.3 2.4.9-2.4.9-.9 2.3-.9-2.3-2.4-.9 2.4-.9z"
        fill="currentColor"
      />
    </svg>
  );
}

function StepIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="h-8 w-8 text-[#ffd84a]"
      fill="none"
    >
      <path
        d="M6.5 16h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18.5 10.5 25 16l-6.5 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="16" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function GentleTrackIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="h-8 w-8 text-[#7edfaa]"
      fill="none"
    >
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M10.8 16.5l3.2 3.2 7-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PauseLeafIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6 text-[#1f9b9b]"
      fill="none"
    >
      <path
        d="M5 19c1-8 6-13 14-14-1 9-6 14-14 14z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M9 15c2-3 4.5-5 7.5-6.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BrainBreakBoltIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6 text-[color:var(--color-accent)]"
      fill="none"
    >
      <path d="M13 2.5 5.5 13H11l-1 8.5L18.5 10H12.5l.5-7.5z" fill="currentColor" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-7 w-7 text-[#2f9e6f]"
      fill="none"
    >
      <path
        d="M12 20.5C6.5 16.8 3.5 14 3.5 10.4 3.5 8 5.4 6.1 7.8 6.1c1.4 0 2.7.7 3.5 1.8.3.4.9.4 1.2 0 .8-1.1 2.1-1.8 3.5-1.8 2.4 0 4.3 1.9 4.3 4.3 0 3.6-3 6.4-8.3 10.1z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BoardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-7 w-7 text-[#bd8b00]"
      fill="none"
    >
      <rect
        x="3.5"
        y="4"
        width="17"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12 15v4M8 21l4-2.2L16 21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 8h8M7 11h5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
      fill="none"
    >
      <path
        d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  const [hideKidsLine, setHideKidsLine] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  // Returning = signed in, or has completed a pause before (the session sets
  // this flag only on completion, not on page open). Returning visitors skip the
  // marketing pitch and land straight on "take today's pause"; first-timers who
  // open the session and bounce still get the full story.
  const [isReturning, setIsReturning] = useState(false);
  // A returning visitor can opt back into the full new-visitor story without
  // losing their place. Not persisted; it only affects this view.
  const [wantsStory, setWantsStory] = useState(false);
  // The returning/new decision lives in localStorage + the Supabase session,
  // both client-only, so the server can't know it. We hold the hero behind a
  // placeholder until this flips true to avoid flashing the wrong hero.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const visited =
      typeof window !== "undefined" &&
      window.localStorage.getItem("tinyPauses.hasCompletedPause") === "1";
    // Decide from localStorage immediately (synchronous) so returning visitors
    // never see the new-visitor hero first. Supabase resolves below and can
    // upgrade a signed-in visitor who has no local flag yet.
    setIsReturning(visited);
    setReady(true);
    async function checkState() {
      if (!supabase) {
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const signedIn = Boolean(user);
      setIsSignedIn(signedIn);
      if (signedIn) {
        setIsReturning(true);
      }
      if (!user) {
        setHideKidsLine(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      setHideKidsLine(Boolean(profile?.adult_mode));
    }
    checkState();
  }, []);

  return (
    <PageShell maxWidth="lg">
      <header className="relative overflow-hidden py-12 text-center sm:py-16">
        <div
          aria-hidden="true"
          className="hero-orb pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(37,224,197,0.15)_0%,rgba(249,115,22,0.08)_48%,rgba(249,115,22,0)_74%)] blur-2xl"
        />
        <div className="relative space-y-4">
          <Image
            src="/brand/LogoLockUp.png"
            alt="Tiny Pauses"
            width={4000}
            height={2000}
            priority
            className="mx-auto h-auto w-44 sm:w-56"
          />
          {!ready ? (
            <div aria-hidden="true" className="min-h-[260px] sm:min-h-[280px]" />
          ) : isReturning && !wantsStory ? (
            <>
              <h1 className="text-balance text-4xl font-semibold leading-tight text-[color:var(--color-primary)] sm:text-5xl">
                Welcome back.
              </h1>
              <p className="mx-auto max-w-xl text-balance text-base text-[color:var(--color-foreground)]/80 sm:text-lg">
                What do you need right now?
              </p>
              <div className="flex flex-col items-center gap-3 pt-1">
                <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
                  <a
                    href="/session?start=pause"
                    className="group flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-4 py-5 text-center shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[#66cccc]/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#66cccc]"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#66cccc]/15 transition group-hover:bg-[#66cccc]/25">
                      <PauseLeafIcon />
                    </span>
                    <span className="text-base font-semibold text-[color:var(--color-primary)]">
                      Take today&apos;s pause
                    </span>
                    <span className="text-xs leading-snug text-[color:var(--color-foreground)]/65">
                      A quiet moment to notice how you feel
                    </span>
                  </a>
                  <a
                    href="/session?start=brain-break"
                    className="group flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-4 py-5 text-center shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[color:var(--color-accent)]/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--color-accent)]"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-accent)]/12 transition group-hover:bg-[color:var(--color-accent)]/20">
                      <BrainBreakBoltIcon />
                    </span>
                    <span className="text-base font-semibold text-[color:var(--color-primary)]">
                      Brain Break
                    </span>
                    <span className="text-xs leading-snug text-[color:var(--color-foreground)]/65">
                      Shake it out and reset in 90 seconds
                    </span>
                  </a>
                </div>
                <a
                  href={isSignedIn ? "/dashboard" : "/login"}
                  className="text-sm text-[color:var(--color-foreground)]/70 underline decoration-[color:var(--color-foreground)]/30 underline-offset-2 hover:text-[color:var(--color-primary)]"
                >
                  {isSignedIn
                    ? "Go to my dashboard"
                    : "Save your pauses, create a free account"}
                </a>
                <button
                  type="button"
                  onClick={() => setWantsStory(true)}
                  className="text-xs text-[color:var(--color-foreground)]/55 underline decoration-[color:var(--color-foreground)]/25 underline-offset-2 hover:text-[color:var(--color-primary)]"
                >
                  New here? See how it works
                </button>
              </div>
            </>
          ) : (
          <>
          <BrandPill>TINY PAUSES · TINY MINDFUL MOMENTS</BrandPill>
          <h1 className="text-balance text-4xl font-semibold leading-tight text-[color:var(--color-primary)] sm:text-5xl">
            A{" "}
            <span className="text-[color:var(--color-accent)]">
              90-second reset
            </span>{" "}
            for when things feel like too much.
          </h1>
          <p className="mx-auto max-w-xl text-balance text-base text-[color:var(--color-foreground)]/80 sm:text-lg">
            Move, shake it out, breathe. Plus tiny mindful moments whenever you
            want one. No writing, no streaks, no pressure.
          </p>
          {!hideKidsLine && (
            <p className="mx-auto max-w-xl text-balance text-sm text-[color:var(--color-foreground)]/62">
              Designed for kids 9-12, with their grown-ups in mind.
            </p>
          )}
          <div className="flex flex-col items-center gap-3 pt-1">
            <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
              <a
                href="/session?start=brain-break"
                className="group flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-4 py-5 text-center shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[color:var(--color-accent)]/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--color-accent)]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-accent)]/12 transition group-hover:bg-[color:var(--color-accent)]/20">
                  <BrainBreakBoltIcon />
                </span>
                <span className="text-base font-semibold text-[color:var(--color-primary)]">
                  Start a Brain Break
                </span>
                <span className="text-xs leading-snug text-[color:var(--color-foreground)]/65">
                  Shake it out and reset in 90 seconds
                </span>
              </a>
              <a
                href="/session?start=pause"
                className="group flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-4 py-5 text-center shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[#66cccc]/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#66cccc]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#66cccc]/15 transition group-hover:bg-[#66cccc]/25">
                  <PauseLeafIcon />
                </span>
                <span className="text-base font-semibold text-[color:var(--color-primary)]">
                  Take a tiny pause
                </span>
                <span className="text-xs leading-snug text-[color:var(--color-foreground)]/65">
                  A quiet moment to notice how you feel
                </span>
              </a>
            </div>
            <a
              href={isSignedIn ? "/dashboard" : "/login"}
              className="text-sm text-[color:var(--color-foreground)]/70 underline decoration-[color:var(--color-foreground)]/30 underline-offset-2 hover:text-[color:var(--color-primary)]"
            >
              {isSignedIn
                ? "Go to my dashboard"
                : "Already have an account? Log in"}
            </a>
          </div>
          <div className="mx-auto mt-2 max-w-md rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-soft)] p-5 text-left shadow-[var(--shadow-soft)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-primary)]/70">
              Here&apos;s what a Brain Break looks like
            </p>
            <p className="mt-2 text-base leading-relaxed text-[color:var(--color-foreground)]/90">
              Shake your hands out like you&apos;re flicking off water. Stomp
              your feet. Squeeze your fists firmly, then let go. Take three slow
              breaths. That&apos;s it.
            </p>
          </div>
          </>
          )}
        </div>
      </header>

      {ready && (!isReturning || wantsStory) && (
        <>
      <section className="mt-8 grid gap-4 text-sm text-[color:var(--color-foreground)]/85 sm:grid-cols-3">
        <BrandCard tone="muted">
          <div className="-mx-6 -mt-6 mb-4 h-1 rounded-t-[var(--radius-card)] bg-[#66cccc]/45" />
          <KidsIcon />
          <p className="mt-3 text-sm font-semibold text-[color:var(--color-primary)]/80">
            For kids 9–12 (and their grown‑ups)
          </p>
          <p className="mt-1">
            Short, concrete prompts written in plain, kind language. No
            lectures, no pressure—just small steps that feel doable.
          </p>
        </BrandCard>
        <BrandCard tone="muted">
          <div className="-mx-6 -mt-6 mb-4 h-1 rounded-t-[var(--radius-card)] bg-[#ffd84a]/50" />
          <StepIcon />
          <p className="mt-3 text-sm font-semibold text-[color:var(--color-primary)]/80">
            One tiny step at a time
          </p>
          <p className="mt-1">
            Each practice has a single simple action—like noticing colors or
            taking three slow breaths—so it works even on busy days.
          </p>
        </BrandCard>
        <BrandCard tone="muted">
          <div className="-mx-6 -mt-6 mb-4 h-1 rounded-t-[var(--radius-card)] bg-[#7edfaa]/50" />
          <GentleTrackIcon />
          <p className="mt-3 text-sm font-semibold text-[color:var(--color-primary)]/80">
            Gentle, no-streak tracking
          </p>
          <p className="mt-1">
            When you log in, Tiny Pauses keeps a soft record of your moments. No
            streaks, no shaming—just a quiet way to see your tiny wins.
          </p>
        </BrandCard>
      </section>

      <Testimonials />

      <section className="mt-4">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
          One pause, three ways in
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[color:var(--color-foreground)]/70">
          The same calm tool, however you come to it.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <a
            href="/session"
            className="group flex flex-col rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[#66cccc]/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#66cccc]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#66cccc]/15">
              <KidsIcon />
            </span>
            <p className="mt-4 text-base font-semibold text-[color:var(--color-primary)]">
              For kids 9-12
            </p>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-[color:var(--color-foreground)]/75">
              A 90-second reset when feelings get big. No writing, no streaks, no
              pressure.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1f9b9b]">
              Start a pause <ArrowIcon />
            </span>
          </a>
          <a
            href="/daily"
            className="group flex flex-col rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[#7edfaa]/70 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f9e6f]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#7edfaa]/25">
              <HeartIcon />
            </span>
            <p className="mt-4 text-base font-semibold text-[color:var(--color-primary)]">
              For parents
            </p>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-[color:var(--color-foreground)]/75">
              A calm moment you can do together. Parent-held account, no ads,
              nothing sold.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2f9e6f]">
              Get daily pauses <ArrowIcon />
            </span>
          </a>
          <a
            href="/for-classrooms"
            className="group flex flex-col rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[#ffd84a]/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#d4a300]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffd84a]/25">
              <BoardIcon />
            </span>
            <p className="mt-4 text-base font-semibold text-[color:var(--color-primary)]">
              For teachers
            </p>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-[color:var(--color-foreground)]/75">
              Quick resets for the whole class. After recess, before a test, any
              restless moment.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#a87e00]">
              For classrooms <ArrowIcon />
            </span>
          </a>
        </div>
      </section>
        </>
      )}

      <BrandCard>
        <div className="flex flex-col items-stretch gap-4 py-1 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="space-y-1 text-sm text-[color:var(--color-foreground)]/75">
            <p className="font-medium text-[color:var(--color-primary)]/85">
              Get a tiny pause every morning.
            </p>
            <p>
              One prompt delivered to your inbox daily. No streaks. No pressure. Free.
            </p>
          </div>
          <BrandButton href="/daily" variant="outlineAccent">
            Sign up for daily pauses
          </BrandButton>
        </div>
      </BrandCard>

      <p className="text-center text-sm text-[color:var(--color-foreground)]/60">
        Made for kids. Loved by grown-ups too.
      </p>

    </PageShell>
  );
}
