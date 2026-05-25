import assert from "node:assert/strict";
import { test } from "node:test";

import {
  formatTeacherPilotMessage,
  isLikelyEmail,
} from "../../src/lib/teacherPilot.ts";

test("isLikelyEmail accepts ordinary addresses", () => {
  assert.equal(isLikelyEmail("ms.rivera@school.org"), true);
  assert.equal(isLikelyEmail("  dave@quietbranches.com  "), true);
});

test("isLikelyEmail rejects malformed or empty values", () => {
  assert.equal(isLikelyEmail(""), false);
  assert.equal(isLikelyEmail("   "), false);
  assert.equal(isLikelyEmail("nope"), false);
  assert.equal(isLikelyEmail("missing@domain"), false);
  assert.equal(isLikelyEmail("two spaces@x.com"), false);
  assert.equal(isLikelyEmail(null), false);
  assert.equal(isLikelyEmail(undefined), false);
  assert.equal(isLikelyEmail(`${"a".repeat(250)}@x.com`), false);
});

test("formatTeacherPilotMessage includes only non-empty fields, email first", () => {
  const out = formatTeacherPilotMessage({
    email: "ms.rivera@school.org",
    grade: "5th",
    classSize: "26",
    setting: "  ", // whitespace-only is dropped
    useCase: "Right after recess",
  });

  const lines = out.split("\n");
  assert.equal(lines[0], "Teacher pilot signup");
  assert.equal(lines[1], "");
  assert.equal(lines[2], "Email: ms.rivera@school.org");
  assert.ok(out.includes("Grade(s) taught: 5th"));
  assert.ok(out.includes("Class size: 26"));
  assert.ok(out.includes("When they would use it: Right after recess"));
  assert.ok(!out.includes("School or setting"));
  assert.ok(!out.includes("Name:"));
  assert.ok(!out.includes("Anything else"));
});

test("formatTeacherPilotMessage trims field values", () => {
  const out = formatTeacherPilotMessage({
    email: "  teach@x.com  ",
    notes: "  loves the idea  ",
  });
  assert.ok(out.includes("Email: teach@x.com"));
  assert.ok(out.includes("Anything else: loves the idea"));
});
