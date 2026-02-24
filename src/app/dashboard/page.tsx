"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { BrandButton, BrandCard, BrandPill, PageShell } from "../ui";

type DayEntry = {
  dateLabel: string;
  practiced: boolean;
};

function buildWeekSkeleton(): DayEntry[] {
  const today = new Date();
  const days: DayEntry[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = d.toLocaleDateString(undefined, {
      weekday: "short",
    });
    days.push({ dateLabel: label, practiced: false });
  }

  return days;
}

export default function DashboardPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("Friend");
  const [week, setWeek] = useState<DayEntry[]>(() => buildWeekSkeleton());

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

      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname, age_band")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.nickname) {
        setNickname(profile.nickname);
      } else {
        router.replace("/onboarding");
        return;
      }

      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);

      const { data: sessions } = await supabase
        .from("sessions")
        .select("completed_at")
        .eq("user_id", user.id)
        .gte("completed_at", sevenDaysAgo.toISOString());

      if (sessions) {
        const updated = buildWeekSkeleton().map((day) => {
          const practiced = sessions.some((s) => {
            const d = new Date(s.completed_at as string);
            const label = d.toLocaleDateString(undefined, {
              weekday: "short",
            });
            return label === day.dateLabel;
          });
          return { ...day, practiced };
        });
        setWeek(updated);
      }
    }

    load();
  }, []);

  const totalPractices = week.filter((d) => d.practiced).length;
  const hasAnyPracticeThisWeek = week.some((d) => d.practiced);
  const formattedNickname = nickname
    .trim()
    .split(/\s+/)
    .map((part) =>
      part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part,
    )
    .join(" ");

  return (
    <PageShell maxWidth="lg">
      <header className="space-y-2">
        <BrandPill>Your calm corner</BrandPill>
        <h1 className="text-3xl font-semibold text-[color:var(--color-primary)]">
          Hi, {formattedNickname}.
        </h1>
        <p className="text-sm text-[color:var(--color-foreground)]/80">
          You can take a tiny mindful moment any time you like. We&apos;ll keep
          gentle track for you.
        </p>
      </header>

      <BrandCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[color:var(--color-primary)]">
              Ready for today&apos;s moment?
            </p>
            <p className="mt-1 text-sm text-[color:var(--color-foreground)]/85">
              It only takes a minute or two. After, you can see how many tiny
              pauses you&apos;ve taken this week.
            </p>
          </div>
          <BrandButton href="/session" variant="primary">
            Take a mindful moment
          </BrandButton>
        </div>
      </BrandCard>

      <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <BrandCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-primary)]/75">
            This week
          </p>
          <p className="mt-1 text-sm text-[color:var(--color-foreground)]/80">
            Every dot is a day. Filled in means you took a tiny pause.
          </p>
          <div className="mt-4 flex items-center justify-between gap-2">
            {week.map((day) => (
              <div key={day.dateLabel} className="flex flex-col items-center">
                <span
                  className={`mb-1 h-3 w-3 rounded-full ${
                    day.practiced
                      ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.2)]"
                      : "bg-[color:var(--color-surface-soft)]"
                  }`}
                />
                <span className="text-[11px] font-medium text-[color:var(--color-foreground)]/70">
                  {day.dateLabel}
                </span>
              </div>
            ))}
          </div>
          {!hasAnyPracticeThisWeek && (
            <p className="mt-4 text-sm text-[color:var(--color-foreground)]/72">
              Your first tiny pause will show up here.
            </p>
          )}
        </BrandCard>

        <BrandCard tone="muted">
          <p className="text-sm font-semibold text-[color:var(--color-primary)]/85">
            Your tiny wins so far
          </p>
          <p className="mt-2 text-4xl font-semibold text-[color:var(--color-accent)]">
            {totalPractices}
            <span className="ml-2 text-base font-medium text-[color:var(--color-primary)]/80">
              {totalPractices === 1 ? "moment" : "moments"}
            </span>
          </p>
          <p className="mt-1 text-sm text-[color:var(--color-foreground)]/80">
            {totalPractices === 0
              ? "Everyone starts somewhere. Your first tiny moment is waiting."
              : "That’s how many mindful moments you’ve taken in the last few days. Each one is a small, real win."}
          </p>
        </BrandCard>
      </section>

      <footer className="mt-2 flex items-center justify-between text-xs text-[color:var(--color-foreground)]/70">
        <a
          href="/"
          className="underline-offset-2 hover:underline text-[color:var(--color-primary)]/80"
        >
          Back to home
        </a>
        <a
          href="/login"
          className="underline-offset-2 hover:underline text-[color:var(--color-primary)]/80"
        >
          Sign in as a different grown‑up
        </a>
      </footer>
    </PageShell>
  );
}

