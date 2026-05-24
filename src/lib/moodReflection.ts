// Reflects a kid's own before/after mood data back to them, gently. The app
// captures how you feel before and after a pause but never tells you what that
// adds up to. This closes that loop: over a recent window it counts how often a
// pause left you lighter, about the same, or heavier, and turns it into one
// kind, non-judgmental sentence. A pause that does not lift you still counts,
// and the copy never makes a kid feel like they are failing at feeling better.
//
// Pure and dependency-free so it unit tests without a DB (moodReflection.test.ts).

export type MoodSession = {
  moodBefore: number | null;
  moodAfter: number | null;
  completedAt: string; // ISO timestamp
};

export type MoodReflection = {
  measured: number; // pauses in window with both a before and after mood
  lifted: number; // felt better after (after > before)
  steady: number; // felt about the same (after === before)
  softened: number; // felt lower after (after < before)
  tone: "lifted" | "steady" | "mixed";
  headline: string;
  body: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildMoodReflection(
  sessions: MoodSession[],
  options: { now?: Date; windowDays?: number; minMeasured?: number } = {},
): MoodReflection | null {
  const now = options.now ?? new Date();
  const windowDays = options.windowDays ?? 30;
  const minMeasured = options.minMeasured ?? 3;
  const cutoff = now.getTime() - windowDays * DAY_MS;

  let lifted = 0;
  let steady = 0;
  let softened = 0;
  for (const session of sessions) {
    if (session.moodBefore == null || session.moodAfter == null) continue;
    const time = Date.parse(session.completedAt);
    if (Number.isNaN(time) || time < cutoff) continue;
    const delta = session.moodAfter - session.moodBefore;
    if (delta > 0) lifted += 1;
    else if (delta === 0) steady += 1;
    else softened += 1;
  }

  const measured = lifted + steady + softened;
  // Hold off until there is enough signal to say anything honest.
  if (measured < minMeasured) return null;

  // Strict plurality wins; any tie reads as "mixed" so we never overclaim.
  let tone: MoodReflection["tone"];
  if (lifted > steady && lifted > softened) {
    tone = "lifted";
  } else if (steady > lifted && steady > softened) {
    tone = "steady";
  } else {
    tone = "mixed";
  }

  let headline: string;
  let body: string;
  if (tone === "lifted") {
    headline = "Pausing tends to lift you.";
    body = `Lately, ${lifted} of your ${measured} pauses left you feeling a little lighter.`;
  } else if (tone === "steady") {
    headline = "A steady kind of calm.";
    body =
      "Lately your pauses mostly leave you feeling about the same. A quiet, steady moment is its own kind of good.";
  } else {
    headline = "However you feel is okay.";
    body =
      "Some pauses lift you, some are just a quiet moment, and some days are heavier. Showing up for them is the part that counts.";
  }

  return { measured, lifted, steady, softened, tone, headline, body };
}
