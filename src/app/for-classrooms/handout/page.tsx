import type { Metadata } from "next";
import { HandoutSheet, type HandoutContent } from "../handout-sheet";

export const metadata: Metadata = {
  title: "Brain Break one-pager for teachers (preview)",
  description:
    "A printable one-page intro to the Tiny Pauses Brain Break board: a 90-second classroom reset you run from the board. How to try it, when to use it, and what makes it safe for school.",
  robots: { index: false, follow: false },
};

const content: HandoutContent = {
  title: "Brain Break",
  subtitle: "A 90-second classroom reset you run from the board",
  accent: "#0e8a8a",
  deep: "#065f5f",
  lead: "When the room is buzzing, tense, or flat, put this on your smartboard and lead it with your body. Movement first, then a few slow breaths.",
  steps: [
    {
      n: "1",
      title: "Open it on your smartboard",
      body: "Go to tinypauses.com/for-classrooms/board.",
    },
    {
      n: "2",
      title: "Pick where the room is, press start",
      body: "Buzzing, tense, or flat. Then choose how much time you have.",
    },
    {
      n: "3",
      title: "Lead it with your body",
      body: "Stand up and do the moves. The class follows you. Done in about 90 seconds.",
    },
  ],
  urlLabel: "Open on the board",
  url: "tinypauses.com/for-classrooms/board",
  tip: "Run it once on your own first, so the first time in front of the class is not cold.",
  moments:
    "Right after recess, before a test, during a noisy transition, after a conflict, or any time the room gets wiggly.",
  safe: "No student accounts. No logins. No ads. No tracking. Nothing is stored. Designed for grades 3-6.",
  askTitle: "This is early. Tell me if it helped.",
  askBody: `After you try it, I would love two minutes: did the room settle? Would you use it again? What got in the way? Reach me at tinypauses.com/for-classrooms, with the "Join the teacher pilot" button.`,
};

export default function HandoutPage() {
  return <HandoutSheet content={content} />;
}
