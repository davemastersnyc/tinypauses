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

  useEffect(() => {
    const visited =
      typeof window !== "undefined" &&
      window.localStorage.getItem("tinyPauses.hasCompletedPause") === "1";
    async function checkState() {
      if (!supabase) {
        setIsReturning(visited);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const signedIn = Boolean(user);
      setIsSignedIn(signedIn);
      setIsReturning(signedIn || visited);
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
          {isReturning && !wantsStory ? (
            <>
              <h1 className="text-balance text-4xl font-semibold leading-tight text-[color:var(--color-primary)] sm:text-5xl">
                Welcome back.
              </h1>
              <p className="mx-auto max-w-xl text-balance text-base text-[color:var(--color-foreground)]/80 sm:text-lg">
                What do you need right now?
              </p>
              <div className="flex flex-col items-center gap-3 pt-1">
                <BrandButton href="/session?start=brain-break" variant="primary">
                  Brain Break in 90 seconds
                </BrandButton>
                <BrandButton href="/session" variant="secondary">
                  Take today&apos;s pause
                </BrandButton>
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
            <BrandButton href="/session?start=brain-break" variant="primary">
              Start a Brain Break
            </BrandButton>
            <BrandButton href="/session" variant="secondary">
              Or take a tiny pause
            </BrandButton>
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
              your feet. Squeeze your fists tight, then let go. Take three slow
              breaths. That&apos;s it.
            </p>
          </div>
          </>
          )}
        </div>
      </header>

      {(!isReturning || wantsStory) && (
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
