import type { Metadata } from "next";
import { HandoutSheet, type HandoutContent } from "../../handout-sheet";

export const metadata: Metadata = {
  title: "Green time one-pager for teachers (preview)",
  description:
    "A printable one-page intro to Tiny Pauses green time: 5-minute, screen-free make-then-rest cards for the quiet classroom slot. How to use them, when, and what makes them safe for school.",
  robots: { index: false, follow: false },
};

const content: HandoutContent = {
  title: "Green time",
  subtitle: "5-minute make-then-rest cards for the quiet slot",
  accent: "#3a9d6e",
  deep: "#1f6f4c",
  lead: "When the room needs a quiet, self-directed reset, green time gives each kid a card: make a small thing, then settle with it. Screen-free, for the five-minute calm slot.",
  steps: [
    {
      n: "1",
      title: "Print a set, or project the menu",
      body: "Go to tinypauses.com/for-classrooms/recipes. Print and cut a deck, or project the board menu.",
    },
    {
      n: "2",
      title: "A kid picks a card",
      body: "Each card is one small make-then-rest activity. They choose what to make.",
    },
    {
      n: "3",
      title: "Make, then rest",
      body: "Make the small thing for a few minutes, then sit quietly with it. About five minutes in all.",
    },
  ],
  urlLabel: "Print or project",
  url: "tinypauses.com/for-classrooms/recipes",
  tip: "Project one set on the board so the class picks from a shared menu, instead of managing a deck for every kid.",
  moments:
    "The quiet work slot, after lunch, independent reading time, or any stretch that needs a calm, self-directed reset.",
  safe: "No student accounts. No logins. No ads. No tracking. The kids' part is fully screen-free. Designed for grades 3-6.",
  note: "Any kid can sit out, or pick a calmer card, and what they draw stays private. This is a whole-class option, not a replacement for an IEP, 504 plan, therapy, or counseling.",
  askTitle: "This is early. Tell me if it helped.",
  askBody: `After you try it, I would love two minutes: did kids settle into it? Would you use it again? What got in the way? Reach me at tinypauses.com/for-classrooms, with the "Join the teacher pilot" button.`,
};

export default function GreenTimeHandoutPage() {
  return <HandoutSheet content={content} />;
}
