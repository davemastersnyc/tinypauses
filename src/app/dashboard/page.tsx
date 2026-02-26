"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  buildSeasonalContext,
  buildWeeklyContext,
  getActiveSeasonalWindow,
  getActiveWeeklyKey,
  pickSeasonalPrompt,
  pickWeeklyPrompt,
  specialNudgeStorageKey,
  type SeasonalWindowRow,
  type SpecialContext,
  type SpecialPromptRow,
} from "@/lib/specialPrompts";
import {
  type CardMetadata,
  type MomentCardMetadata,
  type WrapUpCardMetadata,
  type WrapUpPeriod,
  type WrapUpStats,
  fallbackCardText,
  renderCardBlob,
  renderCardCanvas,
} from "@/lib/cardRenderer";
import { BrandButton, BrandCard, PageShell } from "../ui";

type DayEntry = { dateLabel: string; practiced: boolean };
type MomentRow = {
  id: string;
  created_at: string;
  category: string | null;
  prompt_name: string | null;
  kind?: string | null;
  prompt_title?: string | null;
  title?: string | null;
  mood_value: number | null;
  card_type: string | null;
  special_type?: "seasonal" | "weekly" | null;
  special_key?: string | null;
};
type SessionFallbackRow = {
  completed_at: string | null;
  mood_after: number | null;
};
type WrapUpRow = {
  id: string;
  period_type: WrapUpPeriod;
  period_start: string;
  stats: WrapUpStats;
  created_at: string;
};
type HistoryDot = {
  dayKey: string;
  date: Date;
  weekIndex: number;
  dayIndex: number;
  moment: MomentRow | null;
};
type DotStyle = { fill: string; radius: number };
type TimelineEntry =
  | { kind: "moment"; id: string; createdAt: string; metadata: MomentCardMetadata; row: MomentRow }
  | { kind: "wrap_up"; id: string; createdAt: string; metadata: WrapUpCardMetadata; row: WrapUpRow };

const togetherBannerKey = "tinyPauses.showTogetherBanner";
const togetherSessionKey = "tinyPauses.firstTogetherSession";
const dashboardNudgeKey = "tinyPauses.showTogetherNudge";
const keepMomentWelcomeKey = "tinyPauses.keepMomentWelcome";

function buildWeekSkeleton(): DayEntry[] {
  const today = new Date();
  const days: DayEntry[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      dateLabel: d.toLocaleDateString(undefined, { weekday: "short" }),
      practiced: false,
    });
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
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part))
    .join(" ");
}

function moodDotStyle(mood: number | null | undefined): DotStyle {
  if (mood == null) return { fill: "rgba(120, 116, 109, 0.45)", radius: 4.5 };
  if (mood <= 1) return { fill: "rgba(125, 145, 168, 0.82)", radius: 3.9 };
  if (mood === 2) return { fill: "rgba(197, 151, 120, 0.86)", radius: 4.2 };
  if (mood === 3) return { fill: "rgba(204, 167, 109, 0.9)", radius: 4.7 };
  if (mood === 4) return { fill: "rgba(71, 178, 158, 0.92)", radius: 5.1 };
  return { fill: "rgba(37, 224, 197, 0.95)", radius: 5.6 };
}

function cleanText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function categoryFromKind(kind: string | null | undefined) {
  const raw = cleanText(kind)?.toLowerCase();
  if (!raw) return null;
  if (raw === "pause") return "Just a pause";
  if (raw === "letting-go") return "Letting go";
  if (raw === "reflect") return "Reflecting on today";
  if (raw === "kindness") return "Kindness";
  return toTitleCase(raw.replace(/[-_]/g, " "));
}

function resolveMomentCategory(row: MomentRow) {
  if (row.special_type === "seasonal") {
    return cleanText(row.category) ?? "Seasonal";
  }
  if (row.special_type === "weekly") {
    return cleanText(row.category) ?? "Weekly";
  }
  const raw = cleanText(row.category);
  if (raw) {
    const lower = raw.toLowerCase();
    if (lower === "brain-break" || lower === "brain break") return "Brain break";
    return raw;
  }
  return categoryFromKind(row.kind) ?? "Mindful moment";
}

function resolveMomentPrompt(row: MomentRow) {
  return (
    cleanText(row.prompt_name) ??
    cleanText(row.prompt_title) ??
    cleanText(row.title) ??
    "Tiny pause"
  );
}

function toMomentMetadata(row: MomentRow): MomentCardMetadata {
  return {
    type: "moment",
    category: resolveMomentCategory(row),
    promptName: resolveMomentPrompt(row),
    moodValue: row.mood_value ?? null,
    specialType: row.special_type ?? null,
    specialKey: row.special_key ?? null,
  };
}

function isBrainBreakMomentRow(row: MomentRow) {
  return resolveMomentCategory(row).toLowerCase() === "brain break";
}

function isWeeklySpecialMomentRow(row: MomentRow) {
  return row.special_type === "weekly";
}

function toWrapUpMetadata(row: WrapUpRow): WrapUpCardMetadata {
  return {
    type: "wrap_up",
    periodType: row.period_type,
    periodStart: row.period_start,
    stats: row.stats ?? { total_moments: 0, total_days_with_moments: 0 },
  };
}

function getWrapUpLabel(row: WrapUpRow) {
  const start = new Date(`${row.period_start}T00:00:00`);
  if (row.period_type === "weekly") {
    return `Week of ${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }
  if (row.period_type === "monthly") {
    return start.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }
  return String(start.getFullYear());
}

function getWrapUpSummary(row: WrapUpRow) {
  if (row.stats?.closing_line) return row.stats.closing_line;
  if (row.stats?.mood_descriptor) return row.stats.mood_descriptor;
  return `${row.stats?.total_moments ?? 0} moments`;
}

function TimelineThumb({ metadata }: { metadata: CardMetadata }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisible(true);
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const thumbUrl = useMemo(() => {
    if (!visible) return null;
    const canvas = renderCardCanvas(metadata, 120);
    return canvas ? canvas.toDataURL("image/png") : null;
  }, [visible, metadata]);

  const fallbackText = fallbackCardText(metadata);

  return (
    <div
      ref={ref}
      className="h-[120px] w-[120px] overflow-hidden rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-soft)]"
    >
      {thumbUrl ? (
        <Image
          src={thumbUrl}
          alt=""
          width={120}
          height={120}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : visible ? (
        <div className="flex h-full w-full flex-col justify-center px-2 text-center">
          <p className="text-[11px] font-semibold text-[color:var(--color-primary)]/85">{fallbackText.title}</p>
        </div>
      ) : (
        <div className="h-full w-full animate-pulse bg-[color:var(--color-surface-soft)]" />
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [greetingName, setGreetingName] = useState<string | null>(null);
  const [profileResolved, setProfileResolved] = useState(false);
  const [isAdultMode, setIsAdultMode] = useState(false);
  const [showTogetherNudge, setShowTogetherNudge] = useState(false);
  const [childNameForNudge, setChildNameForNudge] = useState<string | null>(null);
  const [moments, setMoments] = useState<MomentRow[]>([]);
  const [wrapUps, setWrapUps] = useState<WrapUpRow[]>([]);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [visibleTimelineCount, setVisibleTimelineCount] = useState(5);
  const [selectedCard, setSelectedCard] = useState<TimelineEntry | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<{ x: number; y: number; dot: HistoryDot } | null>(null);
  const [specialNudge, setSpecialNudge] = useState<SpecialContext | null>(null);
  const [showKeepMomentWelcome, setShowKeepMomentWelcome] = useState(false);
  const storyWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(dashboardNudgeKey) === "1") {
      setShowTogetherNudge(true);
    }
  }, []);

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
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      const keepMomentWelcome =
        typeof window !== "undefined" &&
        window.sessionStorage.getItem(keepMomentWelcomeKey) === "1";
      if (keepMomentWelcome && typeof window !== "undefined") {
        setShowKeepMomentWelcome(true);
        window.sessionStorage.removeItem(keepMomentWelcomeKey);
      }

      const shouldOnboard = !Boolean(
        profile?.onboarding_complete || profile?.adult_mode || profile?.nickname,
      );
      if (shouldOnboard && !keepMomentWelcome) {
        router.replace("/onboarding");
        return;
      }
      const adultMode = Boolean(profile?.adult_mode);
      setIsAdultMode(adultMode);
      const nicknameValue =
        typeof profile?.nickname === "string" ? profile.nickname : null;
      const childNameValue =
        typeof profile?.child_name === "string" ? profile.child_name : null;
      if (adultMode) {
        setGreetingName(nicknameValue || null);
        setChildNameForNudge(null);
      } else {
        setGreetingName(childNameValue || nicknameValue || "Friend");
        setChildNameForNudge(childNameValue);
      }
      setProfileResolved(true);

      const { data: momentRows, error: momentsError } = await supabase
        .from("moments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      const momentsUnavailable = Boolean(momentsError);
      if (!momentsUnavailable && momentRows && momentRows.length > 0) {
        setMoments((momentRows ?? []) as MomentRow[]);
      } else {
        // Backward compatibility: if moments is empty/unavailable, derive from sessions.
        const { data: sessionRows } = await supabase
          .from("sessions")
          .select("completed_at, mood_after")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false });

        const fallbackMoments: MomentRow[] = ((sessionRows ?? []) as SessionFallbackRow[])
          .filter((s) => Boolean(s.completed_at))
          .map((s) => ({
            id: `session-${s.completed_at}`,
            created_at: s.completed_at as string,
            category: "Mindful moment",
            prompt_name: "Tiny pause",
            mood_value: s.mood_after ?? null,
            card_type: "moment",
          }));

        setMoments(fallbackMoments);
      }

      // Only query wrap_ups if moments table is available (same migration bundle).
      if (!momentsUnavailable) {
        const { data: wrapUpRows } = await supabase
          .from("wrap_ups")
          .select("id, period_type, period_start, stats, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        setWrapUps((wrapUpRows ?? []) as WrapUpRow[]);
      } else {
        setWrapUps([]);
      }

      const now = new Date();
      const completedRows = (momentRows ?? []) as MomentRow[];
      const completedByKey = new Map<string, Set<string>>();
      for (const row of completedRows) {
        const key = cleanText(row.special_key);
        const promptName = cleanText(row.prompt_name);
        if (!key || !promptName) continue;
        const current = completedByKey.get(key) ?? new Set<string>();
        current.add(promptName);
        completedByKey.set(key, current);
      }

      const [{ data: seasonalRows }, { data: specialPromptRows }] = await Promise.all([
        supabase
          .from("seasonal_windows")
          .select("*")
          .eq("active", true),
        supabase
          .from("special_prompts")
          .select("*")
          .eq("status", "active"),
      ]);

      const seasonalWindows = (seasonalRows ?? []) as SeasonalWindowRow[];
      const specialPrompts = (specialPromptRows ?? []) as SpecialPromptRow[];
      const activeSeasonal = getActiveSeasonalWindow(seasonalWindows, now);

      let nextSpecial: SpecialContext | null = null;
      if (activeSeasonal) {
        const seasonalPrompt = pickSeasonalPrompt(specialPrompts, activeSeasonal.key, now);
        if (seasonalPrompt) {
          const activeCount = specialPrompts.filter(
            (prompt) =>
              prompt.special_type === "seasonal" &&
              prompt.special_key === activeSeasonal.key &&
              prompt.status === "active",
          ).length;
          const completedCount =
            completedByKey.get(activeSeasonal.key)?.size ?? 0;
          if (completedCount < activeCount) {
            nextSpecial = buildSeasonalContext(activeSeasonal, seasonalPrompt);
          }
        }
      }

      if (!nextSpecial) {
        const weeklyKey = getActiveWeeklyKey(now);
        if (weeklyKey === "sunday-evening" || weeklyKey === "monday-morning") {
          const weeklyPrompt = pickWeeklyPrompt(specialPrompts, weeklyKey, now);
          if (weeklyPrompt) {
            const completedThisPrompt = completedByKey
              .get(weeklyKey)
              ?.has(weeklyPrompt.name);
            if (!completedThisPrompt) {
              nextSpecial = buildWeeklyContext(weeklyKey, weeklyPrompt);
            }
          }
        }
      }

      if (nextSpecial && typeof window !== "undefined") {
        const key = specialNudgeStorageKey(nextSpecial.key);
        const dismissedAtRaw = window.localStorage.getItem(key);
        if (dismissedAtRaw) {
          const dismissedAt = Number(dismissedAtRaw);
          const elapsed = Number.isFinite(dismissedAt)
            ? now.getTime() - dismissedAt
            : Number.POSITIVE_INFINITY;
          if (elapsed < 24 * 60 * 60 * 1000) {
            nextSpecial = null;
          }
        }
      }

      setSpecialNudge(nextSpecial);
    }

    load();
  }, [router]);

  const momentsAscending = useMemo(() => [...moments].reverse(), [moments]);
  const latestMomentByDay = useMemo(() => {
    const byDay = new Map<string, MomentRow>();
    for (const moment of momentsAscending) {
      const key = dateKey(startOfDay(new Date(moment.created_at)));
      byDay.set(key, moment);
    }
    return byDay;
  }, [momentsAscending]);

  const totalMoments = moments.length;
  const daysWithMomentsCount = latestMomentByDay.size;

  const week = useMemo(() => {
    const recentByDay = new Set<string>();
    const today = startOfDay(new Date());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    for (const key of latestMomentByDay.keys()) {
      const d = new Date(`${key}T00:00:00`);
      if (d >= sevenDaysAgo && d <= today) recentByDay.add(key);
    }
    return buildWeekSkeleton().map((day, idx) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - idx));
      return { ...day, practiced: recentByDay.has(dateKey(d)) };
    });
  }, [latestMomentByDay]);

  const brainBreaksThisWeek = useMemo(() => {
    const today = startOfDay(new Date());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    return moments.reduce((count, moment) => {
      const category = resolveMomentCategory(moment).toLowerCase();
      if (category !== "brain break") return count;
      const day = startOfDay(new Date(moment.created_at));
      if (day < sevenDaysAgo || day > today) return count;
      return count + 1;
    }, 0);
  }, [moments]);

  const historyModel = useMemo(() => {
    const days = Array.from(latestMomentByDay.keys()).sort();
    const today = startOfDay(new Date());
    if (days.length === 0) return { dots: [] as HistoryDot[], weekCount: 1, hasOlderHistory: false };

    const firstMomentDay = new Date(`${days[0]}T00:00:00`);
    const sixMonthsAgo = startOfDay(new Date());
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const start = showFullHistory
      ? firstMomentDay
      : new Date(Math.max(firstMomentDay.getTime(), sixMonthsAgo.getTime()));
    const totalDays = Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1;

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
        moment: latestMomentByDay.get(key) ?? null,
      });
    }
    return {
      dots,
      weekCount: Math.max(1, Math.ceil(totalDays / 7)),
      hasOlderHistory: firstMomentDay.getTime() < sixMonthsAgo.getTime(),
    };
  }, [latestMomentByDay, showFullHistory]);

  const earlyStoryMessage =
    daysWithMomentsCount === 0
      ? "Your story grid is waiting for your first pause."
      : daysWithMomentsCount <= 3
        ? "Your story is just starting. A few more days and your grid will begin to grow."
        : "Almost there. Your story grid unlocks soon.";

  const timelineEntries = useMemo(() => {
    const momentEntries: TimelineEntry[] = moments.map((m) => ({
      kind: "moment",
      id: `moment-${m.id}`,
      createdAt: m.created_at,
      metadata: toMomentMetadata(m),
      row: m,
    }));
    const wrapEntries: TimelineEntry[] = wrapUps.map((w) => ({
      kind: "wrap_up",
      id: `wrap-${w.id}`,
      createdAt: w.created_at,
      metadata: toWrapUpMetadata(w),
      row: w,
    }));
    return [...momentEntries, ...wrapEntries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [moments, wrapUps]);

  const visibleEntries = timelineEntries.slice(0, visibleTimelineCount);
  const hasAnyMomentThisWeek = week.some((d) => d.practiced);
  const formattedGreetingName = greetingName ? toTitleCase(greetingName) : null;
  const selectedCardSharingDisabled =
    selectedCard?.kind === "moment" &&
    (isBrainBreakMomentRow(selectedCard.row) ||
      isWeeklySpecialMomentRow(selectedCard.row));

  const cell = 14;
  const pad = 8;
  const svgWidth = pad * 2 + historyModel.weekCount * cell;
  const svgHeight = pad * 2 + 7 * cell;

  async function shareSelectedCard(entry: TimelineEntry) {
    if (
      entry.kind === "moment" &&
      (isBrainBreakMomentRow(entry.row) || isWeeklySpecialMomentRow(entry.row))
    ) {
      return;
    }
    setShareLoading(true);
    try {
      const blob = await renderCardBlob(entry.metadata, 1080);
      if (!blob) return;
      const file = new File([blob], "tiny-pause-card.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      const canShareFiles =
        typeof nav.share === "function" &&
        typeof nav.canShare === "function" &&
        nav.canShare({ files: [file] });
      if (canShareFiles) {
        await nav.share({ title: "Tiny Pauses", files: [file] });
        return;
      }
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error("Could not share card", error);
    } finally {
      setShareLoading(false);
    }
  }

  function closeCardModal() {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    setSelectedCard(null);
  }

  function downloadCard() {
    if (!downloadUrl) return;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "tiny-pause-card.png";
    link.click();
  }

  function dismissTogetherNudge() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(dashboardNudgeKey);
    }
    setShowTogetherNudge(false);
  }

  function startTogetherFromNudge() {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(togetherBannerKey, "1");
      window.sessionStorage.setItem(togetherSessionKey, "1");
      window.localStorage.removeItem(dashboardNudgeKey);
    }
    setShowTogetherNudge(false);
    router.push("/session");
  }

  function dismissSpecialNudge() {
    if (!specialNudge || typeof window === "undefined") return;
    window.localStorage.setItem(
      specialNudgeStorageKey(specialNudge.key),
      String(Date.now()),
    );
    setSpecialNudge(null);
  }

  function startSpecialFromNudge() {
    if (!specialNudge) return;
    const query = new URLSearchParams({
      specialType: specialNudge.type,
      specialKey: specialNudge.key,
      promptId: specialNudge.prompt.id,
    });
    router.push(`/session?${query.toString()}`);
  }

  return (
    <PageShell maxWidth="lg">
      <header className="space-y-2">
        <p className="inline-flex items-center rounded-[var(--radius-pill)] bg-[color:var(--color-accent-soft)] px-4 py-1 text-xs font-medium text-[color:var(--color-ink-on-accent-soft)] shadow-sm ring-1 ring-[color:var(--color-accent)]/30 backdrop-blur">
          Your calm corner
        </p>
        {profileResolved ? (
          <h1 className="text-3xl font-semibold text-[color:var(--color-primary)]">
            {formattedGreetingName ? `Hi, ${formattedGreetingName}.` : "Hi there."}
          </h1>
        ) : (
          <div className="h-9 w-44 animate-pulse rounded-xl bg-[color:var(--color-surface-soft)]" />
        )}
        <p className="text-sm text-[color:var(--color-foreground)]/80">
          You can take a tiny mindful moment any time you like. We&apos;ll keep gentle track for you.
        </p>
      </header>

      {showKeepMomentWelcome && (
        <BrandCard tone="muted">
          <p className="text-sm text-[color:var(--color-primary)]/88">
            Your tiny pause is saved. Welcome.
          </p>
        </BrandCard>
      )}

      <BrandCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[color:var(--color-primary)]">Ready for today&apos;s moment?</p>
            <p className="mt-1 text-sm text-[color:var(--color-foreground)]/85">
              It only takes a minute or two. After, you can see how many tiny pauses you&apos;ve taken this week.
            </p>
          </div>
          <BrandButton href="/session" variant="primary">
            Take a mindful moment
          </BrandButton>
        </div>
      </BrandCard>

      <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          {showTogetherNudge && !isAdultMode && (
            <BrandCard tone="muted">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-[color:var(--color-primary)]/86">
                    When you&apos;re ready, try a tiny pause with{" "}
                    {childNameForNudge ?? "your kid"}. It&apos;s the best way to
                    start.
                  </p>
                  <div className="mt-3">
                    <BrandButton type="button" onClick={startTogetherFromNudge}>
                      Try one together
                    </BrandButton>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={dismissTogetherNudge}
                  className="rounded-full px-2 py-1 text-xs text-[color:var(--color-primary)]/62 hover:bg-[color:var(--color-surface-soft)] hover:text-[color:var(--color-primary)]"
                  aria-label="Dismiss nudge"
                >
                  ×
                </button>
              </div>
            </BrandCard>
          )}
          <BrandCard>
            <p className="text-sm font-semibold text-[color:var(--color-primary)]/85">This week</p>
            <p className="mt-1 text-sm text-[color:var(--color-foreground)]/80">Every dot is a day you showed up for yourself.</p>
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
                  <span className="text-[11px] font-medium text-[color:var(--color-foreground)]/70">{day.dateLabel}</span>
                </div>
              ))}
            </div>
            {brainBreaksThisWeek > 0 && (
              <p className="mt-3 text-sm text-[#1f6f86]">
                You also took {brainBreaksThisWeek} brain break
                {brainBreaksThisWeek === 1 ? "" : "s"} this week.
              </p>
            )}
            {!hasAnyMomentThisWeek && (
              <p className="mt-4 text-sm text-[color:var(--color-foreground)]/72">Your first tiny pause will show up here.</p>
            )}
          </BrandCard>

          {specialNudge && (
            <BrandCard tone="muted">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                      backgroundColor: `${specialNudge.accentColor}26`,
                      color: "#1f2a44",
                    }}
                  >
                    {specialNudge.badgeLabel}
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--color-primary)]/88">
                    {specialNudge.nudgeCopy}
                  </p>
                  <div className="mt-3">
                    <BrandButton type="button" onClick={startSpecialFromNudge}>
                      Try this one
                    </BrandButton>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={dismissSpecialNudge}
                  className="rounded-full px-2 py-1 text-xs text-[color:var(--color-primary)]/62 hover:bg-[color:var(--color-surface-soft)] hover:text-[color:var(--color-primary)]"
                  aria-label="Dismiss special nudge"
                >
                  ×
                </button>
              </div>
            </BrandCard>
          )}

          <BrandCard>
            <p className="text-sm font-semibold text-[color:var(--color-primary)]/85">Your story so far</p>
            <div
              ref={storyWrapRef}
              className="relative mt-3 overflow-x-auto rounded-xl border border-[color:var(--color-border-subtle)]/65 bg-[color:var(--color-surface-soft)]/45 p-2"
            >
              {daysWithMomentsCount < 7 ? (
                <p className="px-4 py-8 text-center text-sm text-[color:var(--color-foreground)]/68">{earlyStoryMessage}</p>
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
                    const style = dot.moment
                      ? moodDotStyle(dot.moment.mood_value)
                      : { fill: "rgba(137, 146, 157, 0.16)", radius: 4.2 };
                    return (
                      <circle
                        key={dot.dayKey}
                        cx={cx}
                        cy={cy}
                        r={style.radius}
                        fill={style.fill}
                        className={dot.moment ? "cursor-pointer" : ""}
                        onMouseEnter={(event) => {
                          if (!dot.moment || !storyWrapRef.current) return;
                          const rect = storyWrapRef.current.getBoundingClientRect();
                          setActiveTooltip({
                            x: event.clientX - rect.left + 10,
                            y: event.clientY - rect.top - 10,
                            dot,
                          });
                        }}
                        onMouseMove={(event) => {
                          if (!dot.moment || !storyWrapRef.current) return;
                          const rect = storyWrapRef.current.getBoundingClientRect();
                          setActiveTooltip({
                            x: event.clientX - rect.left + 10,
                            y: event.clientY - rect.top - 10,
                            dot,
                          });
                        }}
                        onMouseLeave={() => setActiveTooltip(null)}
                      />
                    );
                  })}
                </svg>
              )}
              {daysWithMomentsCount >= 7 && activeTooltip?.dot.moment && (
                <div
                  className="pointer-events-none absolute z-10 w-52 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-2 text-xs text-[color:var(--color-foreground)] shadow-[var(--shadow-soft)]"
                  style={{
                    left: Math.min(Math.max(activeTooltip.x, 8), (storyWrapRef.current?.clientWidth ?? 240) - 220),
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
                    {resolveMomentCategory(activeTooltip.dot.moment)} ·{" "}
                    {resolveMomentPrompt(activeTooltip.dot.moment)}
                  </p>
                </div>
              )}
            </div>

            {daysWithMomentsCount >= 7 && historyModel.hasOlderHistory && !showFullHistory && (
              <button
                type="button"
                onClick={() => setShowFullHistory(true)}
                className="mt-3 text-xs text-[color:var(--color-primary)]/78 underline decoration-[color:var(--color-primary)]/35 underline-offset-2 hover:text-[color:var(--color-primary)]"
              >
                Show more
              </button>
            )}
          </BrandCard>

          {totalMoments > 0 && (
            <BrandCard>
              <p className="text-sm font-semibold text-[color:var(--color-primary)]/85">Your check-ins</p>
              <div className="mt-3 space-y-3">
                {visibleEntries.map((entry) => {
                  const isBrainBreak =
                    entry.kind === "moment" && isBrainBreakMomentRow(entry.row);
                  const isWeeklySpecial =
                    entry.kind === "moment" && isWeeklySpecialMomentRow(entry.row);
                  const wrapperClass = `flex w-full items-start gap-3 rounded-2xl border border-[color:var(--color-border-subtle)] p-3 text-left transition ${
                    entry.kind === "wrap_up"
                      ? "bg-[color:var(--color-accent-soft)]/28"
                      : "bg-[color:var(--color-surface)]"
                  } ${
                    isBrainBreak || isWeeklySpecial
                      ? "cursor-default"
                      : "hover:bg-[color:var(--color-surface-soft)]"
                  }`;
                  return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => {
                      if (isBrainBreak || isWeeklySpecial) return;
                      setSelectedCard(entry);
                    }}
                    className={wrapperClass}
                  >
                    <TimelineThumb metadata={entry.metadata} />
                    <div className="min-w-0 flex-1">
                      {entry.kind === "moment" ? (
                        <>
                          <p
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              isBrainBreak
                                ? "bg-[#d9f3f8] text-[#1f6f86]"
                                : entry.row.special_type === "seasonal"
                                  ? "text-[#3a2d14]"
                                  : entry.row.special_type === "weekly"
                                    ? "bg-[#ede7ff] text-[#4f3e85]"
                                : "bg-[color:var(--color-accent-soft)] text-[color:var(--color-ink-on-accent-soft)]"
                            }`}
                            style={
                              entry.row.special_type === "seasonal"
                                ? {
                                    backgroundColor: "#f4c44733",
                                  }
                                : undefined
                            }
                          >
                            {resolveMomentCategory(entry.row)}
                          </p>
                          <p className="mt-1 truncate text-sm font-medium text-[color:var(--color-primary)]">
                            {resolveMomentPrompt(entry.row)}
                          </p>
                          <p className="mt-1 text-xs text-[color:var(--color-foreground)]/72">
                            {new Date(entry.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[color:var(--color-primary)]">{getWrapUpLabel(entry.row)}</p>
                            <span className="rounded-full bg-[color:var(--color-surface)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[color:var(--color-primary)]/75">
                              {entry.row.period_type}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[color:var(--color-foreground)]/74">
                            {getWrapUpSummary(entry.row)}
                          </p>
                        </>
                      )}
                    </div>
                  </button>
                  );
                })}
              </div>
              {visibleTimelineCount < timelineEntries.length && (
                <button
                  type="button"
                  onClick={() => setVisibleTimelineCount((v) => v + 10)}
                  className="mt-3 text-xs text-[color:var(--color-primary)]/82 underline decoration-[color:var(--color-primary)]/45 underline-offset-2 hover:text-[color:var(--color-primary)]"
                >
                  Load more
                </button>
              )}
            </BrandCard>
          )}
        </div>

        <BrandCard tone="muted">
          <p className="text-sm font-semibold text-[color:var(--color-primary)]/85">Your tiny wins so far</p>
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
        <Link href="/" className="underline-offset-2 hover:underline text-[color:var(--color-primary)]/80">
          Back to home
        </Link>
        <Link href="/login" className="underline-offset-2 hover:underline text-[color:var(--color-primary)]/80">
          Sign in as a different grown-up
        </Link>
      </footer>

      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[color:var(--color-surface)] p-4 shadow-[0_22px_55px_rgba(2,6,23,0.45)]">
            {(() => {
              const canvas = renderCardCanvas(selectedCard.metadata, 720);
              if (!canvas) {
                const fallback = fallbackCardText(selectedCard.metadata);
                return (
                  <div className="rounded-xl border border-[color:var(--color-border-subtle)] p-6 text-center">
                    <p className="text-base font-semibold text-[color:var(--color-primary)]">{fallback.title}</p>
                    <p className="mt-1 text-sm text-[color:var(--color-foreground)]/75">{fallback.subtitle}</p>
                    <p className="mt-2 text-xs text-[color:var(--color-foreground)]/62">
                      Canvas isn&apos;t available here. You can screenshot this card.
                    </p>
                  </div>
                );
              }
              return (
                <Image
                  src={canvas.toDataURL("image/png")}
                  alt="Card preview"
                  width={720}
                  height={720}
                  unoptimized
                  className="w-full rounded-xl border border-[color:var(--color-border-subtle)]"
                />
              );
            })()}
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {selectedCardSharingDisabled ? (
                <BrandButton type="button" variant="secondary" fullWidth disabled>
                  Sharing unavailable
                </BrandButton>
              ) : (
                <BrandButton type="button" onClick={() => shareSelectedCard(selectedCard)} fullWidth>
                  {shareLoading ? "Preparing..." : "Share"}
                </BrandButton>
              )}
              {downloadUrl ? (
                <BrandButton type="button" variant="secondary" onClick={downloadCard} fullWidth>
                  Download image
                </BrandButton>
              ) : (
                <div />
              )}
              <BrandButton type="button" variant="secondary" onClick={closeCardModal} fullWidth>
                Close
              </BrandButton>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

