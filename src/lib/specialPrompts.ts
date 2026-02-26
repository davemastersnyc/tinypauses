export type SpecialType = "seasonal" | "weekly";

export type SeasonalWindowRow = {
  key: string;
  name: string;
  start_date: string;
  end_date: string;
  accent_color: string;
  badge_label: string;
  nudge_copy: string;
  active: boolean;
};

export type SpecialPromptRow = {
  id: string;
  special_type: SpecialType;
  special_key: string;
  seasonal_window_key: string | null;
  name: string;
  body: string;
  tiny_step: string;
  rotation_order: number | null;
  status: "active" | "inactive" | "draft";
  internal_notes: string | null;
  created_at: string;
};

export type SpecialContext = {
  type: SpecialType;
  key: string;
  name: string;
  badgeLabel: string;
  accentColor: string;
  nudgeCopy: string;
  illustrationKey:
    | "pencil"
    | "ghost"
    | "leaf"
    | "star"
    | "heart"
    | "sun"
    | "moon"
    | "sunrise";
  shareable: boolean;
  prompt: SpecialPromptRow;
};

const weeklyMeta = {
  "sunday-evening": {
    name: "Sunday evening",
    badgeLabel: "Sunday evening",
    accentColor: "#66cccc",
    nudgeCopy: "The Sunday feeling is real. This one is for that.",
    illustrationKey: "moon" as const,
    shareable: false,
  },
  "monday-morning": {
    name: "Monday morning",
    badgeLabel: "Monday morning",
    accentColor: "#f0ca60",
    nudgeCopy: "Monday, am I right. Two minutes before the week starts.",
    illustrationKey: "sunrise" as const,
    shareable: false,
  },
};

const seasonalIllustrationByKey: Record<
  string,
  "pencil" | "ghost" | "leaf" | "star" | "heart" | "sun"
> = {
  "back-to-school": "pencil",
  halloween: "ghost",
  "thanksgiving-week": "leaf",
  "holiday-season": "star",
  "valentines-day": "heart",
  "end-of-school-year": "sun",
};

function parseMonthDayToDate(template: string, year: number) {
  const month = Number(template.slice(5, 7));
  const day = Number(template.slice(8, 10));
  return new Date(year, month - 1, day);
}

function normalizeDate(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function isWithinWindow(now: Date, start: Date, end: Date) {
  const current = normalizeDate(now);
  const s = normalizeDate(start);
  const e = normalizeDate(end);
  if (s <= e) {
    return current >= s && current <= e;
  }
  return current >= s || current <= e;
}

function getUsThanksgivingWeek(year: number) {
  const nov1 = new Date(year, 10, 1);
  const dayOfWeek = nov1.getDay();
  const firstThursdayOffset = (4 - dayOfWeek + 7) % 7;
  const fourthThursdayDate = 1 + firstThursdayOffset + 21;
  const thanksgiving = new Date(year, 10, fourthThursdayDate);
  const weekStart = new Date(thanksgiving);
  weekStart.setDate(thanksgiving.getDate() - 3);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return { weekStart, weekEnd };
}

export function getActiveSeasonalWindow(
  windows: SeasonalWindowRow[],
  now: Date,
): SeasonalWindowRow | null {
  const currentYear = now.getFullYear();
  for (const window of windows) {
    if (!window.active) continue;
    if (window.key === "thanksgiving-week") {
      const { weekStart, weekEnd } = getUsThanksgivingWeek(currentYear);
      if (isWithinWindow(now, weekStart, weekEnd)) return window;
      continue;
    }
    const start = parseMonthDayToDate(window.start_date, currentYear);
    const end = parseMonthDayToDate(window.end_date, currentYear);
    if (isWithinWindow(now, start, end)) return window;
  }
  return null;
}

export function getActiveWeeklyKey(now: Date) {
  const day = now.getDay();
  const hour = now.getHours();
  if (day === 0 && hour >= 17 && hour <= 23) return "sunday-evening";
  if (day === 1 && hour >= 5 && hour < 12) return "monday-morning";
  return null;
}

export function getIsoWeekNumber(date: Date) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = target.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / 604800000);
}

function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export function pickWeeklyPrompt(
  prompts: SpecialPromptRow[],
  key: string,
  now: Date,
) {
  const active = prompts
    .filter(
      (prompt) =>
        prompt.special_type === "weekly" &&
        prompt.special_key === key &&
        prompt.status === "active",
    )
    .sort((a, b) => (a.rotation_order ?? 999) - (b.rotation_order ?? 999));
  if (active.length === 0) return null;
  const week = getIsoWeekNumber(now);
  return active[(week - 1) % active.length] ?? null;
}

export function pickSeasonalPrompt(
  prompts: SpecialPromptRow[],
  key: string,
  now: Date,
) {
  const active = prompts
    .filter(
      (prompt) =>
        prompt.special_type === "seasonal" &&
        prompt.special_key === key &&
        prompt.status === "active",
    )
    .sort((a, b) => (a.rotation_order ?? 999) - (b.rotation_order ?? 999));
  if (active.length === 0) return null;
  const index = dayOfYear(now) % active.length;
  return active[index] ?? null;
}

export function buildSeasonalContext(
  window: SeasonalWindowRow,
  prompt: SpecialPromptRow,
): SpecialContext {
  return {
    type: "seasonal",
    key: window.key,
    name: window.name,
    badgeLabel: window.badge_label,
    accentColor: window.accent_color,
    nudgeCopy: window.nudge_copy,
    illustrationKey: seasonalIllustrationByKey[window.key] ?? "star",
    shareable: true,
    prompt,
  };
}

export function buildWeeklyContext(
  key: "sunday-evening" | "monday-morning",
  prompt: SpecialPromptRow,
): SpecialContext {
  const meta = weeklyMeta[key];
  return {
    type: "weekly",
    key,
    name: meta.name,
    badgeLabel: meta.badgeLabel,
    accentColor: meta.accentColor,
    nudgeCopy: meta.nudgeCopy,
    illustrationKey: meta.illustrationKey,
    shareable: meta.shareable,
    prompt,
  };
}

export const specialNudgeStorageKey = (specialKey: string) =>
  `tinyPauses.specialNudgeDismissed.${specialKey}`;

