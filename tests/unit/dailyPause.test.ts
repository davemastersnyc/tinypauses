import assert from "node:assert/strict";
import { test } from "node:test";

import { dailyPromptIndex, dateKey } from "../../src/lib/dailyPause.ts";

test("dateKey formats local Y-M-D with zero padding", () => {
  assert.equal(dateKey(new Date(2026, 0, 3)), "2026-01-03");
  assert.equal(dateKey(new Date(2026, 11, 25)), "2026-12-25");
});

test("dailyPromptIndex is stable for the same day", () => {
  const a = dailyPromptIndex(new Date(2026, 4, 24), 20);
  const b = dailyPromptIndex(new Date(2026, 4, 24), 20);
  assert.equal(a, b);
});

test("dailyPromptIndex always lands in range", () => {
  for (let day = 1; day <= 28; day += 1) {
    const idx = dailyPromptIndex(new Date(2026, 4, day), 7);
    assert.ok(idx >= 0 && idx < 7, `index ${idx} out of range`);
    assert.equal(Number.isInteger(idx), true);
  }
});

test("dailyPromptIndex rotates across days (not stuck on one prompt)", () => {
  const seen = new Set<number>();
  for (let day = 1; day <= 7; day += 1) {
    seen.add(dailyPromptIndex(new Date(2026, 4, day), 20));
  }
  assert.ok(seen.size >= 2, "expected the daily pick to vary over a week");
});

test("dailyPromptIndex handles empty and single-item lists", () => {
  assert.equal(dailyPromptIndex(new Date(2026, 4, 24), 0), 0);
  assert.equal(dailyPromptIndex(new Date(2026, 4, 24), 1), 0);
});
