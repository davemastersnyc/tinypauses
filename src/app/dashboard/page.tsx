"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { BrandButton, BrandCard, BrandPill, PageShell } from "../ui";

type DayEntry = {
  dateLabel: string;
  practiced: boolean;
};

type SessionHistoryRow = {
  completed_at: string | null;
  mood_after?: number | null;
  kind?: string | null;
  category?: string | null;
  prompt_title?: string | null;
  prompt_name?: string | null;
  title?: string | null;
};

type HistoryDot = {
  dayKey: string;
  date: Date;
  weekIndex: number;
  dayIndex: number;
  session: SessionHistoryRow | null;
};

type DotStyle = {
  fill: string;
  radius: number;
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

function startOfDay(value: Date) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateKey(value: Date) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toTitleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) =>
      part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part,
    )
    .join(" ");
}

function toCategoryLabel(session: SessionHistoryRow | null) {
  const raw = session?.kind ?? session?.category ?? "mindful moment";
  return toTitleCase(raw.replace(/[-_]/g, " "));
}

function toPromptLabel(session: SessionHistoryRow | null) {
  return (
    session?.prompt_title ??
    session?.prompt_name ??
    session?.title ??
    "Tiny pause"
  );
}

function moodDotStyle(mood: number | null | undefined): DotStyle {
  if (mood == null) {
    return { fill: "rgba(120, 116, 109, 0.45)", radius: 4.5 };
  }
  if (mood <= 1) return { fill: "rgba(125, 145, 168, 0.82)", radius: 3.9 };
  if (mood === 2) return { fill: "rgba(197, 151, 120, 0.86)", radius: 4.2 };
  if (mood === 3) return { fill: "rgba(204, 167, 109, 0.9)", radius: 4.7 };
  if (mood === 4) return { fill: "rgba(71, 178, 158, 0.92)", radius: 5.1 };
  return { fill: "rgba(37, 224, 197, 0.95)", radius: 5.6 };
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

export default function DashboardPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("Friend");
  const [sessions, setSessions] = useState<SessionHistoryRow[]>([]);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<{
    x: number;
    y: number;
    dot: HistoryDot;
  } | null>(null);
  const [storyShareLoading, setStoryShareLoading] = useState(false);
  const [storyImageUrl, setStoryImageUrl] = useState<string | null>(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const storyWrapRef = useRef<HTMLDivElement | null>(null);

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

      const { data: allSessions } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: true });

      setSessions((allSessions ?? []) as SessionHistoryRow[]);
    }

    load();
  }, []);

  const sessionsWithDates = useMemo(
    () => sessions.filter((s) => Boolean(s.completed_at)),
    [sessions],
  );

  const sessionsSorted = useMemo(
    () =>
      [...sessionsWithDates].sort(
        (a, b) =>
          new Date(a.completed_at as string).getTime() -
          new Date(b.completed_at as string).getTime(),
      ),
    [sessionsWithDates],
  );

  const latestMomentByDay = useMemo(() => {
    const byDay = new Map<string, SessionHistoryRow>();
    for (const moment of sessionsSorted) {
      const d = startOfDay(new Date(moment.completed_at as string));
      byDay.set(dateKey(d), moment);
    }
    return byDay;
  }, [sessionsSorted]);

  const daysWithMomentsCount = latestMomentByDay.size;
  const totalMoments = sessionsWithDates.length;

  const week = useMemo(() => {
    const recentByDay = new Set<string>();
    const today = startOfDay(new Date());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    for (const key of latestMomentByDay.keys()) {
      const d = startOfDay(new Date(`${key}T00:00:00`));
      if (d >= sevenDaysAgo && d <= today) recentByDay.add(key);
    }

    return buildWeekSkeleton().map((day, idx) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - idx));
      return { ...day, practiced: recentByDay.has(dateKey(d)) };
    });
  }, [latestMomentByDay]);

  const historyModel = useMemo(() => {
    const today = startOfDay(new Date());
    if (sessionsSorted.length === 0) {
      return {
        dots: [] as HistoryDot[],
        weekCount: 1,
        hasOlderHistory: false,
      };
    }

    const firstMomentDay = startOfDay(
      new Date(sessionsSorted[0].completed_at as string),
    );
    const sixMonthsAgo = startOfDay(new Date());
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const start = showFullHistory
      ? firstMomentDay
      : new Date(Math.max(firstMomentDay.getTime(), sixMonthsAgo.getTime()));
    const hasOlderHistory = firstMomentDay.getTime() < sixMonthsAgo.getTime();

    const totalDays =
      Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1;
    const dots: HistoryDot[] = [];

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = dateKey(d);
      dots.push({
        dayKey: key,
        date: d,
        weekIndex: Math.floor(i / 7),
        dayIndex: i % 7,
        session: latestMomentByDay.get(key) ?? null,
      });
    }

    return {
      dots,
      weekCount: Math.max(1, Math.ceil(totalDays / 7)),
      hasOlderHistory,
    };
  }, [latestMomentByDay, sessionsSorted, showFullHistory]);

  const storyLine =
    daysWithMomentsCount === 0
      ? "Your story starts with your first tiny pause."
      : daysWithMomentsCount <= 4
        ? "Your story is just getting started."
        : daysWithMomentsCount <= 15
          ? "You're building something real here."
          : daysWithMomentsCount <= 30
            ? "Look at all these tiny pauses."
            : "You've been showing up for yourself for a while now.";

  const earlyStoryMessage =
    daysWithMomentsCount === 0
      ? "Your story grid is waiting for your first pause."
      : daysWithMomentsCount <= 3
        ? "Your story is just starting. A few more days and your grid will begin to grow."
        : "Almost there. Your story grid unlocks soon.";

  const hasAnyPracticeThisWeek = week.some((d) => d.practiced);
  const formattedNickname = toTitleCase(nickname);

  const cell = 14;
  const pad = 8;
  const svgWidth = pad * 2 + historyModel.weekCount * cell;
  const svgHeight = pad * 2 + 7 * cell;

  async function generateStoryCardBlob() {
    const cardSize = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = cardSize;
    canvas.height = cardSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas context.");

    const gradient = ctx.createLinearGradient(0, 0, 0, cardSize);
    gradient.addColorStop(0, "#ffedd8");
    gradient.addColorStop(1, "#ffe2bf");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cardSize, cardSize);

    ctx.fillStyle = "rgba(255,255,255,0.32)";
    ctx.fillRect(78, 78, 924, 924);

    ctx.textAlign = "center";
    ctx.fillStyle = "#1b2438";
    ctx.font = "600 66px Inter, Avenir Next, Segoe UI, sans-serif";
    ctx.fillText("My tiny pauses", cardSize / 2, 156);

    ctx.fillStyle = "#f97316";
    ctx.font = "700 82px Inter, Avenir Next, Segoe UI, sans-serif";
    ctx.fillText(
      `${totalMoments} ${totalMoments === 1 ? "moment" : "moments"}`,
      cardSize / 2,
      248,
    );

    if (daysWithMomentsCount >= 10) {
      const today = startOfDay(new Date());
      const weeks = 16;
      const totalDays = weeks * 7;
      const start = new Date(today);
      start.setDate(today.getDate() - (totalDays - 1));

      const shareCell = 38;
      const gridWidth = weeks * shareCell;
      const x0 = (cardSize - gridWidth) / 2;
      const y0 = 336;

      for (let i = 0; i < totalDays; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = dateKey(d);
        const dayMoment = latestMomentByDay.get(key) ?? null;
        const weekIndex = Math.floor(i / 7);
        const dayIndex = i % 7;
        const cx = x0 + weekIndex * shareCell + shareCell / 2;
        const cy = y0 + dayIndex * shareCell + shareCell / 2;
        const style = dayMoment
          ? moodDotStyle(dayMoment.mood_after)
          : { fill: "rgba(163, 171, 179, 0.2)", radius: 9.5 };

        ctx.beginPath();
        ctx.arc(
          cx,
          cy,
          dayMoment ? style.radius * 1.9 : style.radius,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = style.fill;
        ctx.fill();
      }
    } else {
      drawSprout(ctx, cardSize / 2, 560, "#2f7e58");
    }

    ctx.fillStyle = "rgba(27, 36, 56, 0.62)";
    ctx.font = "500 30px Inter, Avenir Next, Segoe UI, sans-serif";
    ctx.fillText("tinypause.app", cardSize / 2, 988);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("Could not encode story image.");
    return blob;
  }

  async function handleShareStory() {
    if (storyShareLoading) return;
    setStoryShareLoading(true);
    try {
      const blob = await generateStoryCardBlob();
      const file = new File([blob], "tiny-pause-story.png", { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };

      const canShareFiles =
        typeof nav.share === "function" &&
        typeof nav.canShare === "function" &&
        nav.canShare({ files: [file] });

      if (canShareFiles) {
        await nav.share({
          title: "My tiny pauses",
          text: "My Tiny Pause story so far.",
          files: [file],
        });
        return;
      }

      if (storyImageUrl) URL.revokeObjectURL(storyImageUrl);
      const url = URL.createObjectURL(blob);
      setStoryImageUrl(url);
      setShowStoryModal(true);
    } catch (error) {
      console.error("Unable to share story", error);
    } finally {
      setStoryShareLoading(false);
    }
  }

  function closeStoryModal() {
    if (storyImageUrl) URL.revokeObjectURL(storyImageUrl);
    setStoryImageUrl(null);
    setShowStoryModal(false);
  }

  function downloadStoryImage() {
    if (!storyImageUrl) return;
    const link = document.createElement("a");
    link.href = storyImageUrl;
    link.download = "tiny-pause-story.png";
    link.click();
  }

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
        <div className="space-y-4">
          <BrandCard>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-primary)]/75">
              This week
            </p>
            <p className="mt-1 text-sm text-[color:var(--color-foreground)]/80">
              Every dot is a day you showed up for yourself.
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

          <BrandCard>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-primary)]/75">
              Your story so far
            </p>
            <p className="mt-1 text-sm text-[color:var(--color-foreground)]/80">
              {storyLine}
            </p>

            <div
              ref={storyWrapRef}
              className="relative mt-4 overflow-x-auto rounded-xl border border-[color:var(--color-border-subtle)]/65 bg-[color:var(--color-surface-soft)]/45 p-2"
            >
              {daysWithMomentsCount < 7 ? (
                <p className="px-4 py-8 text-center text-sm text-[color:var(--color-foreground)]/68">
                  {earlyStoryMessage}
                </p>
              ) : (
                <svg
                  width={svgWidth}
                  height={svgHeight}
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  role="img"
                  aria-label="Moment history dots"
                >
                  {historyModel.dots.map((dot) => {
                    const cx = pad + dot.weekIndex * cell + cell / 2;
                    const cy = pad + dot.dayIndex * cell + cell / 2;
                    const style = dot.session
                      ? moodDotStyle(dot.session.mood_after)
                      : { fill: "rgba(137, 146, 157, 0.16)", radius: 4.2 };

                    return (
                      <circle
                        key={dot.dayKey}
                        cx={cx}
                        cy={cy}
                        r={style.radius}
                        fill={style.fill}
                        className={dot.session ? "cursor-pointer" : ""}
                        onMouseEnter={(event) => {
                          if (!dot.session || !storyWrapRef.current) return;
                          const rect = storyWrapRef.current.getBoundingClientRect();
                          setActiveTooltip({
                            x: event.clientX - rect.left + 10,
                            y: event.clientY - rect.top - 10,
                            dot,
                          });
                        }}
                        onMouseMove={(event) => {
                          if (!dot.session || !storyWrapRef.current) return;
                          const rect = storyWrapRef.current.getBoundingClientRect();
                          setActiveTooltip({
                            x: event.clientX - rect.left + 10,
                            y: event.clientY - rect.top - 10,
                            dot,
                          });
                        }}
                        onMouseLeave={() => setActiveTooltip(null)}
                        onClick={(event) => {
                          if (!dot.session || !storyWrapRef.current) return;
                          const rect = storyWrapRef.current.getBoundingClientRect();
                          setActiveTooltip({
                            x: event.clientX - rect.left + 10,
                            y: event.clientY - rect.top - 10,
                            dot,
                          });
                        }}
                      />
                    );
                  })}
                </svg>
              )}

              {daysWithMomentsCount >= 7 && activeTooltip?.dot.session && (
                <div
                  className="pointer-events-none absolute z-10 w-52 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-2 text-xs text-[color:var(--color-foreground)] shadow-[var(--shadow-soft)]"
                  style={{
                    left: Math.min(
                      Math.max(activeTooltip.x, 8),
                      (storyWrapRef.current?.clientWidth ?? 240) - 220,
                    ),
                    top: Math.max(activeTooltip.y - 54, 8),
                  }}
                >
                  <p className="font-medium">
                    {activeTooltip.dot.date.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-0.5 text-[color:var(--color-foreground)]/78">
                    {toCategoryLabel(activeTooltip.dot.session)} ·{" "}
                    {toPromptLabel(activeTooltip.dot.session)}
                  </p>
                </div>
              )}
            </div>

            {daysWithMomentsCount >= 7 &&
              historyModel.hasOlderHistory &&
              !showFullHistory && (
              <button
                type="button"
                onClick={() => setShowFullHistory(true)}
                className="mt-3 text-xs text-[color:var(--color-primary)]/78 underline decoration-[color:var(--color-primary)]/35 underline-offset-2 hover:text-[color:var(--color-primary)]"
              >
                Show more
              </button>
              )}

            {daysWithMomentsCount >= 10 && (
              <button
                type="button"
                onClick={handleShareStory}
                disabled={storyShareLoading || totalMoments === 0}
                className="mt-3 text-xs text-[color:var(--color-primary)]/82 underline decoration-[color:var(--color-primary)]/45 underline-offset-2 hover:text-[color:var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {storyShareLoading ? "Preparing story..." : "Share your story"}
              </button>
            )}
          </BrandCard>
        </div>

        <BrandCard tone="muted">
          <p className="text-sm font-semibold text-[color:var(--color-primary)]/85">
            Your tiny wins so far
          </p>
          <p className="mt-2 text-4xl font-semibold text-[color:var(--color-accent)]">
            {totalMoments}
            <span className="ml-2 text-base font-medium text-[color:var(--color-primary)]/80">
              {totalMoments === 1 ? "moment" : "moments"}
            </span>
          </p>
          <p className="mt-1 text-sm text-[color:var(--color-foreground)]/80">
            {totalMoments === 0
              ? "Everyone starts somewhere. Your first tiny moment is waiting."
              : "That's how many mindful moments you've taken overall. Each one is a small, real win."}
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
      {showStoryModal && storyImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[color:var(--color-surface)] p-4 shadow-[0_22px_55px_rgba(2,6,23,0.45)]">
            <img
              src={storyImageUrl}
              alt="Story share card preview"
              className="w-full rounded-xl border border-[color:var(--color-border-subtle)]"
            />
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <BrandButton type="button" onClick={downloadStoryImage} fullWidth>
                Download image
              </BrandButton>
              <BrandButton
                type="button"
                variant="secondary"
                onClick={closeStoryModal}
                fullWidth
              >
                Close
              </BrandButton>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

