// Shared config for automated social posts: fixed calendar specials and growth
// milestones. Seasonal date-range windows live in specialPrompts.ts and the DB;
// this file covers one-off calendar dates and milestone thresholds.

export type CalendarSpecial = {
  key: string;
  label: string;
  title: string;
  body: string;
  step: string;
  matches: (date: Date) => boolean;
};

function isSecondSundayInMarch(date: Date) {
  return (
    date.getMonth() === 2 &&
    date.getDay() === 0 &&
    date.getDate() >= 8 &&
    date.getDate() <= 14
  );
}

function isFirstSundayInNovember(date: Date) {
  return (
    date.getMonth() === 10 &&
    date.getDay() === 0 &&
    date.getDate() >= 1 &&
    date.getDate() <= 7
  );
}

export const calendarSpecials: CalendarSpecial[] = [
  {
    key: "dst-spring",
    label: "Daylight savings",
    title: "Daylight savings, gentle start",
    body: "If today feels off, you are not behind. Your body is just adjusting to the time change.",
    step: "Get daylight on your face for 2 minutes, then take 3 slow breaths.",
    matches: isSecondSundayInMarch,
  },
  {
    key: "dst-fall",
    label: "Extra hour",
    title: "An extra hour",
    body: "Clocks fall back today, so you have one extra hour. It does not have to be productive.",
    step: "Spend 2 quiet minutes doing nothing at all.",
    matches: isFirstSundayInNovember,
  },
  {
    key: "new-year",
    label: "New year",
    title: "Quiet new year",
    body: "No big resolutions needed. Small, kind habits beat loud promises.",
    step: "Name one tiny thing you want a little more of this year. Just one.",
    matches: (date) => date.getMonth() === 0 && date.getDate() === 1,
  },
  {
    key: "first-day-summer",
    label: "Summer start",
    title: "Slow summer start",
    body: "Longer days, slower pace. Let today have a little more room than usual.",
    step: "Step outside for one minute and just notice the light.",
    matches: (date) => date.getMonth() === 5 && date.getDate() === 21,
  },
];

export function getCalendarSpecialForDate(date: Date): CalendarSpecial | null {
  return calendarSpecials.find((special) => special.matches(date)) ?? null;
}

// Growth milestones. When a running total crosses a threshold, a celebration
// post fires once (tracked in the social_milestone_log table).
export const milestoneThresholds = {
  pauses: [100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000],
  subscribers: [50, 100, 250, 500, 1000, 2500, 5000],
} as const;

export type MilestoneKind = keyof typeof milestoneThresholds;

export type MilestoneHit = {
  kind: MilestoneKind;
  threshold: number;
};

export function milestoneId(hit: MilestoneHit): string {
  return `${hit.kind}:${hit.threshold}`;
}

// Highest threshold each total has crossed that has not already been posted.
export function newlyCrossedMilestones(
  totals: Record<MilestoneKind, number>,
  alreadyPosted: Set<string>,
): MilestoneHit[] {
  const hits: MilestoneHit[] = [];
  for (const kind of Object.keys(milestoneThresholds) as MilestoneKind[]) {
    const total = totals[kind] ?? 0;
    const crossed = milestoneThresholds[kind].filter((value) => total >= value);
    const highest = crossed[crossed.length - 1];
    if (highest && !alreadyPosted.has(milestoneId({ kind, threshold: highest }))) {
      hits.push({ kind, threshold: highest });
    }
  }
  return hits;
}

// Personal milestones celebrate an individual's own pause count in-app. They
// are smaller and more frequent than the global growth thresholds above, which
// drive the Instagram celebration posts. Because each completed pause adds
// exactly one moment, an exact-equality check fires a milestone once, on the
// pause that lands on the threshold (no ledger needed).
export const personalPauseThresholds: readonly number[] = [
  1, 5, 10, 25, 50, 100, 250, 500, 1000,
];

export function personalMilestoneForCount(total: number): number | null {
  return personalPauseThresholds.includes(total) ? total : null;
}

export function milestoneCardCopy(hit: MilestoneHit) {
  if (hit.kind === "pauses") {
    return {
      label: "Milestone",
      headline: `${hit.threshold.toLocaleString()} tiny pauses`,
      title: "And counting, one gentle moment at a time.",
      body: `Together we have taken ${hit.threshold.toLocaleString()} tiny pauses. That is a lot of small, kind moments.`,
      step: "Take one more right now: three slow breaths.",
    };
  }
  return {
    label: "Milestone",
    headline: `${hit.threshold.toLocaleString()} morning pauses`,
    title: "Thank you for being here.",
    body: `${hit.threshold.toLocaleString()} kids and grown-ups now get a tiny pause each morning.`,
    step: "Forward your favorite pause to one person today.",
  };
}
