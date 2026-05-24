import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildMoodReflection,
  type MoodSession,
} from "../../src/lib/moodReflection.ts";

const NOW = new Date(2026, 4, 24); // fixed reference day for the window math

// Builds a session `daysAgo` before NOW with the given before/after moods.
function session(
  daysAgo: number,
  moodBefore: number | null,
  moodAfter: number | null,
): MoodSession {
  const d = new Date(NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return { moodBefore, moodAfter, completedAt: d.toISOString() };
}

test("returns null until there are enough measured pauses", () => {
  const sessions = [session(1, 2, 4), session(2, 3, 4)]; // only 2 measured
  assert.equal(buildMoodReflection(sessions, { now: NOW }), null);
});

test("ignores pauses missing a before or after mood", () => {
  const sessions = [
    session(1, null, 4),
    session(2, 3, null),
    session(3, 2, 4),
    session(4, 2, 3),
    session(5, 1, 2),
  ];
  const reflection = buildMoodReflection(sessions, { now: NOW });
  assert.ok(reflection);
  assert.equal(reflection.measured, 3); // only the three complete ones count
});

test("ignores pauses outside the window", () => {
  const sessions = [
    session(1, 2, 4),
    session(2, 2, 4),
    session(3, 2, 4),
    session(40, 1, 4), // older than the 30 day window
  ];
  const reflection = buildMoodReflection(sessions, { now: NOW });
  assert.ok(reflection);
  assert.equal(reflection.measured, 3);
  assert.equal(reflection.lifted, 3);
});

test("lifted tone when rising pauses are the clear plurality", () => {
  const sessions = [
    session(1, 2, 4),
    session(2, 1, 3),
    session(3, 2, 4),
    session(4, 3, 3), // steady
  ];
  const reflection = buildMoodReflection(sessions, { now: NOW });
  assert.ok(reflection);
  assert.equal(reflection.tone, "lifted");
  assert.equal(reflection.lifted, 3);
  assert.match(reflection.body, /3 of your 4 pauses/);
});

test("steady tone when most pauses leave mood unchanged", () => {
  const sessions = [
    session(1, 3, 3),
    session(2, 2, 2),
    session(3, 4, 4),
    session(4, 2, 3), // one lift
  ];
  const reflection = buildMoodReflection(sessions, { now: NOW });
  assert.ok(reflection);
  assert.equal(reflection.tone, "steady");
});

test("mixed tone on a tie, with non-judgmental copy", () => {
  const sessions = [
    session(1, 2, 4), // lift
    session(2, 1, 3), // lift
    session(3, 4, 2), // soften
    session(4, 3, 1), // soften
  ];
  const reflection = buildMoodReflection(sessions, { now: NOW });
  assert.ok(reflection);
  assert.equal(reflection.tone, "mixed");
  assert.equal(reflection.lifted, 2);
  assert.equal(reflection.softened, 2);
  assert.match(reflection.headline, /okay/i);
});
