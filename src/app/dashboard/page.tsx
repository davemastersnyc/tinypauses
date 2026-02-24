"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type DayEntry = {
  dateLabel: string;
  practiced: boolean;
};

function buildFakeWeek(): DayEntry[] {
  const today = new Date();
  const days: DayEntry[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = d.toLocaleDateString(undefined, {
      weekday: "short",
    });
    // For now we fake a gentle pattern: some yes, some no.
    const practiced = i === 0 || i === 2 || i === 4;
    days.push({ dateLabel: label, practiced });
  }

  return days;
}

export default function DashboardPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("Friend");
  const [week, setWeek] = useState<DayEntry[]>(() => buildFakeWeek());

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
        .select("nickname")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.nickname) {
        setNickname(profile.nickname);
      }

      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);

      const { data: sessions } = await supabase
        .from("sessions")
        .select("completed_at")
        .gte("completed_at", sevenDaysAgo.toISOString());

      if (sessions) {
        const updated = buildFakeWeek().map((day) => {
          const practiced = sessions.some((s) => {
            const d = new Date(s.completed_at as string);
            const label = d.toLocaleDateString(undefined, {
              weekday: "short",
            });
            return label === day.dateLabel;
          });
          return { ...day, practiced: practiced || day.practiced };
        });
        setWeek(updated);
      }
    }

    load();
  }, []);

  const totalPractices = week.filter((d) => d.practiced).length;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 via-indigo-50 to-violet-50 px-4">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-12">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            PracticeApp
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Hi, {nickname}.
          </h1>
          <p className="text-sm text-slate-700">
            This is your calm corner. You can take a tiny mindful moment any
            time you like.
          </p>
        </header>

        <section className="flex flex-col gap-4 rounded-3xl bg-white/90 p-6 shadow-lg shadow-sky-100 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">
              Ready for today&apos;s moment?
            </p>
            <p className="mt-1 text-sm text-slate-700">
              It only takes a minute or two. After, you can see how many tiny
              pauses you&apos;ve taken this week.
            </p>
          </div>
          <a
            href="/session"
            className="inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-sky-200 transition hover:bg-sky-700 hover:shadow-lg"
          >
            Take a mindful moment
          </a>
        </section>

        <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
          <div className="space-y-4 rounded-3xl bg-white/90 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
              This week
            </p>
            <p className="text-sm text-slate-700">
              Every dot is a day. Filled in means you took a tiny pause.
            </p>
            <div className="flex items-center justify-between gap-2">
              {week.map((day) => (
                <div key={day.dateLabel} className="flex flex-col items-center">
                  <span
                    className={`mb-1 h-3 w-3 rounded-full ${
                      day.practiced
                        ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]"
                        : "bg-slate-200"
                    }`}
                  />
                  <span className="text-[11px] font-medium text-slate-600">
                    {day.dateLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-3xl bg-white/90 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Tiny wins
            </p>
            <p className="text-3xl font-semibold text-slate-900">
              {totalPractices}
            </p>
            <p className="text-sm text-slate-700">
              {totalPractices === 0
                ? "Everyone starts somewhere. Your first tiny moment is waiting."
                : "That’s how many mindful moments you’ve taken in the last few days. Each one is a small, real win."}
            </p>
          </div>
        </section>

        <footer className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <a href="/" className="underline-offset-2 hover:underline">
            Back to home
          </a>
          <a href="/login" className="underline-offset-2 hover:underline">
            Sign in as a different grown‑up
          </a>
        </footer>
      </main>
    </div>
  );
}

