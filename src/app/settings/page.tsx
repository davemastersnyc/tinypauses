"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { BrandButton, BrandCard, PageShell } from "../ui";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function SettingsPage() {
  const router = useRouter();
  const [resolved, setResolved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [adultMode, setAdultMode] = useState(false);
  const [name, setName] = useState("");
  const [dailyEmail, setDailyEmail] = useState(false);

  const [profileState, setProfileState] = useState<SaveState>("idle");
  const [emailState, setEmailState] = useState<SaveState>("idle");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);
      setUserEmail(user.email ?? null);

      const { data: profile } = await supabase
        .from("profiles")
        .select("adult_mode, display_name, child_name, daily_email_subscriber")
        .eq("id", user.id)
        .maybeSingle();

      const isAdult = Boolean(profile?.adult_mode);
      setAdultMode(isAdult);
      setName(
        (isAdult
          ? (profile?.display_name as string | null)
          : (profile?.child_name as string | null)) ?? "",
      );
      setDailyEmail(Boolean(profile?.daily_email_subscriber));
      setResolved(true);
    }
    load();
  }, [router]);

  async function saveProfile() {
    if (!supabase || !userId) return;
    setProfileState("saving");
    const trimmed = name.trim();
    const patch = adultMode
      ? { adult_mode: true, display_name: trimmed || null }
      : { adult_mode: false, child_name: trimmed || null };
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    setProfileState(error ? "error" : "saved");
  }

  async function setDailyEmailEnabled(enabled: boolean) {
    if (!supabase || !userId || !userEmail) return;
    setEmailState("saving");
    try {
      if (enabled) {
        const response = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail }),
        });
        if (!response.ok) throw new Error("subscribe failed");
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const response = await fetch("/api/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
          },
        });
        if (!response.ok) throw new Error("unsubscribe failed");
      }
      await supabase
        .from("profiles")
        .update({ daily_email_subscriber: enabled })
        .eq("id", userId);
      setDailyEmail(enabled);
      setEmailState("saved");
    } catch {
      setEmailState("error");
    }
  }

  async function exportData() {
    if (!supabase || !userId) return;
    setExporting(true);
    try {
      const [moments, favorites, wrapUps] = await Promise.all([
        supabase.from("moments").select("*").eq("user_id", userId),
        supabase.from("favorite_prompts").select("*").eq("user_id", userId),
        supabase.from("wrap_ups").select("*").eq("user_id", userId),
      ]);
      const payload = {
        exported_at: new Date().toISOString(),
        email: userEmail,
        moments: moments.data ?? [],
        favorites: favorites.data ?? [],
        wrap_ups: wrapUps.data ?? [],
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "tiny-pauses-data.json";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <PageShell maxWidth="md">
      <header className="space-y-2">
        <p className="inline-flex items-center rounded-[var(--radius-pill)] bg-[color:var(--color-accent-soft)] px-4 py-1 text-xs font-medium text-[color:var(--color-ink-on-accent-soft)] shadow-sm ring-1 ring-[color:var(--color-accent)]/30">
          Your settings
        </p>
        <h1 className="text-3xl font-semibold text-[color:var(--color-primary)]">
          A few small things, your way.
        </h1>
        <p className="text-sm text-[color:var(--color-foreground)]/80">
          Nothing here is required. Change what you like, whenever you like.
        </p>
      </header>

      {!resolved ? (
        <div className="h-40 animate-pulse rounded-[var(--radius-card)] bg-[color:var(--color-surface-soft)]" />
      ) : (
        <>
          <BrandCard>
            <p className="text-sm font-semibold text-[color:var(--color-primary)]/85">Profile</p>
            <p className="mt-1 text-sm text-[color:var(--color-foreground)]/80">
              Who is this tiny corner for?
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setAdultMode(false);
                  setProfileState("idle");
                }}
                className={`rounded-2xl border px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 ${
                  !adultMode
                    ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-ink-on-accent-soft)]"
                    : "border-[color:var(--color-border-subtle)] text-[color:var(--color-foreground)]/85 hover:bg-[color:var(--color-surface-soft)]"
                }`}
              >
                For my child
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdultMode(true);
                  setProfileState("idle");
                }}
                className={`rounded-2xl border px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 ${
                  adultMode
                    ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-ink-on-accent-soft)]"
                    : "border-[color:var(--color-border-subtle)] text-[color:var(--color-foreground)]/85 hover:bg-[color:var(--color-surface-soft)]"
                }`}
              >
                For me
              </button>
            </div>
            <label
              htmlFor="settings-name"
              className="mt-4 block text-sm font-medium text-[color:var(--color-primary)]"
            >
              {adultMode ? "Your name" : "Your child's name"}
            </label>
            <input
              id="settings-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setProfileState("idle");
              }}
              placeholder={adultMode ? "What should we call you?" : "What should we call them?"}
              className="mt-1 w-full rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-primary)] shadow-sm outline-none placeholder:text-[color:var(--color-foreground)]/40 focus:border-[color:var(--color-accent)] focus:ring-2 focus:ring-[color:var(--color-accent-soft)]"
            />
            <div className="mt-4 flex items-center gap-3">
              <BrandButton type="button" onClick={saveProfile} disabled={profileState === "saving"}>
                {profileState === "saving" ? "Saving..." : "Save"}
              </BrandButton>
              {profileState === "saved" && (
                <span className="text-sm text-[color:var(--color-foreground)]/70">Saved 🌱</span>
              )}
              {profileState === "error" && (
                <span className="text-sm text-red-600">Could not save. Try again.</span>
              )}
            </div>
          </BrandCard>

          <BrandCard>
            <p className="text-sm font-semibold text-[color:var(--color-primary)]/85">Daily pause email</p>
            <p className="mt-1 text-sm text-[color:var(--color-foreground)]/80">
              {dailyEmail
                ? "You get one tiny pause each morning. Turn it off any time."
                : "Get one tiny pause in your inbox each morning. No streaks, no pressure."}
            </p>
            <div className="mt-4 flex items-center gap-3">
              {dailyEmail ? (
                <BrandButton
                  type="button"
                  variant="secondary"
                  onClick={() => setDailyEmailEnabled(false)}
                  disabled={emailState === "saving"}
                >
                  {emailState === "saving" ? "Updating..." : "Turn off daily email"}
                </BrandButton>
              ) : (
                <BrandButton
                  type="button"
                  onClick={() => setDailyEmailEnabled(true)}
                  disabled={emailState === "saving"}
                >
                  {emailState === "saving" ? "Updating..." : "Turn on daily email"}
                </BrandButton>
              )}
              {emailState === "saved" && (
                <span className="text-sm text-[color:var(--color-foreground)]/70">Updated 🌱</span>
              )}
              {emailState === "error" && (
                <span className="text-sm text-red-600">Could not update. Try again.</span>
              )}
            </div>
          </BrandCard>

          <BrandCard>
            <p className="text-sm font-semibold text-[color:var(--color-primary)]/85">Your data</p>
            <p className="mt-1 text-sm text-[color:var(--color-foreground)]/80">
              Everything Tiny Pauses keeps for you, in one file. Yours to take any time.
            </p>
            <div className="mt-4">
              <BrandButton
                type="button"
                variant="outlineAccent"
                onClick={exportData}
                disabled={exporting}
              >
                {exporting ? "Preparing..." : "Export my data"}
              </BrandButton>
            </div>
          </BrandCard>
        </>
      )}
    </PageShell>
  );
}
