"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { BrandButton, BrandCard, BrandPill, PageShell } from "../ui";

type AnchorMoment =
  | "After school"
  | "Before bed"
  | "After dinner"
  | "We'll figure it out";
type OnboardingView = "entry" | "child" | "adult-name" | "adult-welcome";

const togetherBannerKey = "tinyPauses.showTogetherBanner";
const togetherSessionKey = "tinyPauses.firstTogetherSession";
const dashboardNudgeKey = "tinyPauses.showTogetherNudge";
const pendingMomentKey = "pending_moment";
const pendingMomentSavedKey = "tinyPauses.pendingMomentSaved";
const childOnboardingSteps = 6;

const anchorOptions: Array<{
  label: AnchorMoment;
  icon: ReactNode;
}> = [
  {
    label: "After school",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path d="M4 6h16v11H4z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 6V4h8v2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    label: "Before bed",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path d="M4 11h16v6H4z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M6 11V8h4v3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    label: "After dinner",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <circle cx="9" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M15 8v8m3-8v8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "We'll figure it out",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 8v4m0 4h.01" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<OnboardingView>("entry");
  const [childStep, setChildStep] = useState(1);
  const [childName, setChildName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [anchorMoment, setAnchorMoment] = useState<AnchorMoment | null>(null);
  const [pendingMomentSaved, setPendingMomentSaved] = useState(false);

  const childNameForCopy = useMemo(
    () => (childName.trim() ? childName.trim() : "your kid"),
    [childName],
  );

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

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.onboarding_complete) {
        router.replace("/dashboard");
        return;
      }

      if (typeof profile?.child_name === "string") {
        setChildName(profile.child_name);
      }
      if (typeof profile?.display_name === "string") {
        setDisplayName(profile.display_name);
      }
      if (typeof profile?.anchor_moment === "string") {
        setAnchorMoment(profile.anchor_moment as AnchorMoment);
      }
      if (profile?.adult_mode) {
        setView("adult-name");
      }
      if (typeof window !== "undefined") {
        const saved = window.sessionStorage.getItem(pendingMomentSavedKey) === "1";
        if (saved) {
          setPendingMomentSaved(true);
          window.sessionStorage.removeItem(pendingMomentSavedKey);
        }
      }

      setLoading(false);
    }

    init();
  }, [router]);

  async function updateProfile(patch: Record<string, unknown>) {
    if (!supabase || !userId) return;
    const payload = { id: userId, ...patch };
    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });
    if (upsertError) throw upsertError;
  }

  async function persistPendingMomentIfAny() {
    if (!supabase || !userId || typeof window === "undefined") return false;
    const raw = window.localStorage.getItem(pendingMomentKey);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as {
      prompt_name?: string;
      category?: string;
      mood_value?: number | null;
      created_at?: string;
    };
    const { error: insertError } = await supabase.from("moments").insert({
      user_id: userId,
      created_at: parsed.created_at ?? new Date().toISOString(),
      category: parsed.category ?? "Mindful moment",
      prompt_name: parsed.prompt_name ?? "Tiny pause",
      mood_value: typeof parsed.mood_value === "number" ? parsed.mood_value : null,
      card_type: "moment",
    });
    if (insertError) throw insertError;
    window.localStorage.removeItem(pendingMomentKey);
    return true;
  }

  async function skipSetup() {
    setSaving(true);
    setError(null);
    try {
      await persistPendingMomentIfAny();
      await updateProfile({
        onboarding_complete: true,
        onboarding_skipped: true,
      });
      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Couldn’t skip setup right now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function chooseChildPath() {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ adult_mode: false });
      setView("child");
      setChildStep(1);
    } catch (err) {
      console.error(err);
      setError("Couldn’t save that right now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function chooseAdultPath() {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ adult_mode: true });
      setView("adult-name");
    } catch (err) {
      console.error(err);
      setError("Couldn’t save that right now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function continueAdultToWelcome(name: string | null) {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        adult_mode: true,
        display_name: name,
        onboarding_complete: true,
        onboarding_skipped: false,
      });
      setView("adult-welcome");
    } catch (err) {
      console.error(err);
      setError("Couldn’t save that right now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function saveAdultNameAndContinue() {
    const trimmed = displayName.trim();
    if (!trimmed) return;
    await continueAdultToWelcome(trimmed);
  }

  async function skipAdultName() {
    await continueAdultToWelcome(null);
  }

  async function saveChildNameAndNext() {
    if (!childName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ child_name: childName.trim() });
      setChildStep(5);
    } catch (err) {
      console.error(err);
      setError("Couldn’t save that right now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function saveAnchorAndNext() {
    setSaving(true);
    setError(null);
    try {
      if (anchorMoment) {
        await updateProfile({ anchor_moment: anchorMoment });
      }
      setChildStep(6);
    } catch (err) {
      console.error(err);
      setError("Couldn’t save that right now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function completeOnboardingAndTryTogether() {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        child_name: childName.trim() || null,
        anchor_moment: anchorMoment ?? null,
        onboarding_complete: true,
        onboarding_skipped: false,
      });
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(togetherBannerKey, "1");
        window.sessionStorage.setItem(togetherSessionKey, "1");
      }
      router.replace("/session");
    } catch (err) {
      console.error(err);
      setError("Couldn’t finish setup right now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function completeOnboardingAndExploreFirst() {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        child_name: childName.trim() || null,
        anchor_moment: anchorMoment ?? null,
        onboarding_complete: true,
        onboarding_skipped: false,
      });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(dashboardNudgeKey, "1");
      }
      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Couldn’t finish setup right now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageShell maxWidth="md">
        <BrandCard tone="muted">
          <p className="text-sm text-[color:var(--color-foreground)]/80">
            Getting things ready...
          </p>
        </BrandCard>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="md">
      <section className="relative">
        {view === "child" && (
          <>
            <button
              type="button"
              onClick={skipSetup}
              disabled={saving}
              className="absolute right-0 top-0 text-xs text-[color:var(--color-primary)]/70 underline decoration-[color:var(--color-primary)]/30 underline-offset-2 hover:text-[color:var(--color-primary)] disabled:opacity-50"
            >
              Skip setup
            </button>
            <div className="mx-auto mb-4 mt-7 w-full max-w-md">
              <div className="mb-2 text-center text-xs font-medium text-[#2c7d91]/85">
                Step {childStep} of {childOnboardingSteps}
              </div>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: childOnboardingSteps }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-2 flex-1 rounded-full ${
                      idx < childStep ? "bg-[#4ea6be]" : "bg-[#bfdde7]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        <BrandCard>
          {view === "entry" && (
            <div className="space-y-5 text-center">
              <h1 className="text-3xl font-semibold text-[color:var(--color-primary)]">
                Who&apos;s this for?
              </h1>
              <p className="text-base text-[color:var(--color-foreground)]/82">
                We&apos;ll set things up the right way.
              </p>
              <div className="mx-auto flex w-full max-w-md flex-col gap-3">
                <BrandButton
                  type="button"
                  onClick={chooseChildPath}
                  fullWidth
                  disabled={saving}
                >
                  I&apos;m setting this up for my child
                </BrandButton>
                <BrandButton
                  type="button"
                  variant="secondary"
                  onClick={chooseAdultPath}
                  fullWidth
                  disabled={saving}
                >
                  This is for me
                </BrandButton>
              </div>
            </div>
          )}

          {view === "adult-name" && (
            <div className="space-y-5 text-center">
              <h1 className="text-2xl font-semibold text-[color:var(--color-primary)]">
                What should we call you?
              </h1>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Your name"
                className="mx-auto block w-full max-w-sm rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-4 py-3 text-center text-lg text-[color:var(--color-primary)] shadow-sm outline-none placeholder:text-[color:var(--color-foreground)]/40 focus:border-[#4ea6be] focus:ring-2 focus:ring-[#d9f3f8]"
              />
              <BrandButton
                type="button"
                onClick={saveAdultNameAndContinue}
                fullWidth
                disabled={!displayName.trim() || saving}
              >
                That&apos;s me
              </BrandButton>
              <button
                type="button"
                onClick={skipAdultName}
                disabled={saving}
                className="text-xs text-[color:var(--color-primary)]/70 underline decoration-[color:var(--color-primary)]/26 underline-offset-2 hover:text-[color:var(--color-primary)]"
              >
                Skip for now
              </button>
            </div>
          )}

          {view === "adult-welcome" && (
            <div className="space-y-6 text-center">
              <h1 className="text-3xl font-semibold text-[color:var(--color-primary)]">
                {pendingMomentSaved ? "Your tiny pause is saved." : "You're all set."}
              </h1>
              <p className="mx-auto max-w-xl text-base text-[color:var(--color-foreground)]/84">
                {pendingMomentSaved
                  ? "It's the first one in your collection. Come back whenever you need another."
                  : "Take a tiny pause any time you need one. We'll keep gentle track for you."}
              </p>
              <BrandButton
                href={pendingMomentSaved ? "/dashboard" : "/session"}
                fullWidth
              >
                {pendingMomentSaved ? "See my collection" : "Take my first tiny pause"}
              </BrandButton>
            </div>
          )}

          {view === "child" && childStep === 1 && (
            <div className="space-y-5 text-center">
              <BrandPill>You&apos;re setting this up for a kid.</BrandPill>
              <h1 className="text-3xl font-semibold text-[color:var(--color-primary)]">
                You&apos;re setting this up for a kid.
              </h1>
              <p className="text-lg font-medium text-[color:var(--color-primary)]/82">
                That&apos;s a good thing.
              </p>
              <p className="mx-auto max-w-xl text-base text-[color:var(--color-foreground)]/84">
                Tiny Pauses helps kids 9-12 take short, gentle mindful moments. No
                writing, no talking, no pressure. Just a tiny pause when they need
                one.
              </p>
              <p className="text-6xl" aria-hidden="true">🌱</p>
              <BrandButton type="button" onClick={() => setChildStep(2)} fullWidth>
                Let&apos;s get started
              </BrandButton>
            </div>
          )}

          {view === "child" && childStep === 2 && (
            <div className="space-y-5">
              <h1 className="text-center text-2xl font-semibold text-[color:var(--color-primary)]">
                Here&apos;s what you&apos;re giving them.
              </h1>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#e8f8f5] p-4">
                  <p className="text-sm font-semibold text-[#1d7f6f]">
                    Tiny Pauses is
                  </p>
                  <ul className="mt-2 space-y-2 text-sm text-[#1d7f6f]/90">
                    <li>2-3 minutes, any time</li>
                    <li>Gentle and judgment-free</li>
                    <li>Something they control</li>
                    <li>Theirs to keep</li>
                  </ul>
                </div>
                <div className="rounded-2xl bg-[color:var(--color-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-[color:var(--color-primary)]/70">
                    Tiny Pauses isn&apos;t
                  </p>
                  <ul className="mt-2 space-y-2 text-sm text-[color:var(--color-foreground)]/76">
                    <li>A meditation app</li>
                    <li>A therapy tool</li>
                    <li>Something they have to do</li>
                    <li>Another screen to get lost in</li>
                  </ul>
                </div>
              </div>
              <p className="text-center text-xs italic text-[color:var(--color-foreground)]/68">
                It&apos;s just a tiny pause. That&apos;s the whole idea.
              </p>
              <BrandButton type="button" onClick={() => setChildStep(3)} fullWidth>
                Got it
              </BrandButton>
            </div>
          )}

          {view === "child" && childStep === 3 && (
            <div className="space-y-5">
              <h1 className="text-center text-2xl font-semibold text-[color:var(--color-primary)]">
                A note before you set this up.
              </h1>
              <ul className="space-y-3 text-sm text-[color:var(--color-foreground)]/86">
                {[
                  "No ads. Ever.",
                  "We don't sell your data or your kid's data. Ever.",
                  "We only collect what we need: your email, your kid's first name, and their moments.",
                  "Your kid's tiny pauses belong to them.",
                  "We built this for kids, not for advertisers.",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f8f5] text-[#1d7f6f]">
                      ✓
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="text-center">
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[color:var(--color-primary)]/66 underline decoration-[color:var(--color-primary)]/30 underline-offset-2 hover:text-[color:var(--color-primary)]"
                >
                  Read our full privacy policy
                </a>
              </div>
              <BrandButton type="button" onClick={() => setChildStep(4)} fullWidth>
                I appreciate that
              </BrandButton>
            </div>
          )}

          {view === "child" && childStep === 4 && (
            <div className="space-y-5 text-center">
              <h1 className="text-2xl font-semibold text-[color:var(--color-primary)]">
                What&apos;s your kid&apos;s name?
              </h1>
              <p className="text-sm text-[color:var(--color-foreground)]/78">
                Just their first name. We&apos;ll use it to make the app feel a
                little more personal for them.
              </p>
              <input
                type="text"
                value={childName}
                onChange={(event) => setChildName(event.target.value)}
                placeholder="First name"
                className="mx-auto block w-full max-w-sm rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-4 py-3 text-center text-lg text-[color:var(--color-primary)] shadow-sm outline-none placeholder:text-[color:var(--color-foreground)]/40 focus:border-[#4ea6be] focus:ring-2 focus:ring-[#d9f3f8]"
              />
              <p className="text-xs text-[color:var(--color-foreground)]/66">
                You can change this any time in settings.
              </p>
              <BrandButton
                type="button"
                onClick={saveChildNameAndNext}
                fullWidth
                disabled={!childName.trim() || saving}
              >
                That&apos;s them
              </BrandButton>
              <button
                type="button"
                onClick={() => setChildStep(5)}
                disabled={saving}
                className="text-xs text-[color:var(--color-primary)]/70 underline decoration-[color:var(--color-primary)]/26 underline-offset-2 hover:text-[color:var(--color-primary)]"
              >
                Skip for now
              </button>
            </div>
          )}

          {view === "child" && childStep === 5 && (
            <div className="space-y-5">
              <h1 className="text-center text-2xl font-semibold text-[color:var(--color-primary)]">
                When might tiny pauses happen?
              </h1>
              <p className="text-center text-sm text-[color:var(--color-foreground)]/78">
                Kids build habits around moments that already exist in their day.
                Pick one that might work for your family -- you can always change
                it.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {anchorOptions.map((option) => {
                  const selected = anchorMoment === option.label;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setAnchorMoment(option.label)}
                      className={`rounded-2xl border p-3 text-left transition ${
                        selected
                          ? "border-[#4ea6be] bg-[#e6f5f9] text-[#1f6f86]"
                          : "border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] text-[color:var(--color-primary)]/82 hover:border-[#4ea6be] hover:bg-[#eef8fb]"
                      }`}
                    >
                      <span className="mb-1 inline-flex">{option.icon}</span>
                      <p className="text-sm font-medium">{option.label}</p>
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-xs text-[color:var(--color-foreground)]/68">
                This is just a reminder for you, not a lock-in. Tiny Pauses works
                any time.
              </p>
              <BrandButton
                type="button"
                onClick={saveAnchorAndNext}
                fullWidth
                disabled={saving}
              >
                That works
              </BrandButton>
            </div>
          )}

          {view === "child" && childStep === 6 && (
            <div className="space-y-5 text-center">
              <h1 className="text-2xl font-semibold text-[color:var(--color-primary)]">
                One last thing.
              </h1>
              <p className="text-sm text-[color:var(--color-foreground)]/80">
                The best way to introduce this to {childNameForCopy} is to try it
                together first.
              </p>
              <p className="text-sm text-[color:var(--color-foreground)]/82">
                It takes two minutes. You&apos;ll both know what it feels like
                before they ever do it alone. And honestly -- you might need a tiny
                pause too.
              </p>
              <BrandButton
                type="button"
                onClick={completeOnboardingAndTryTogether}
                fullWidth
                disabled={saving}
              >
                Try one together right now
              </BrandButton>
              <button
                type="button"
                onClick={completeOnboardingAndExploreFirst}
                disabled={saving}
                className="text-sm text-[color:var(--color-primary)]/78 underline decoration-[color:var(--color-primary)]/28 underline-offset-2 hover:text-[color:var(--color-primary)]"
              >
                I&apos;ll explore on my own first
              </button>
            </div>
          )}

          {error && (
            <p className="mt-4 text-center text-xs text-rose-600" role="alert">
              {error}
            </p>
          )}
        </BrandCard>
      </section>
    </PageShell>
  );
}

