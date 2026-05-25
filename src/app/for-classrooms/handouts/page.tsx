import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "../../ui";

export const metadata: Metadata = {
  title: "Classroom handouts for teachers (preview)",
  description:
    "Printable one-page intros to the Tiny Pauses classroom tools: the 90-second Brain Break board, and 5-minute green time cards. Open one, print it, or hand it to a teacher.",
  robots: { index: false, follow: false },
};

function BrainBreakMotif() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-6 w-6"
      fill="none"
      stroke="#0e8a8a"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="24" cy="11" r="4" fill="#0e8a8a" stroke="none" />
      <path d="M24 17v10" />
      <path d="M24 19l-8-4M24 19l8-4" />
      <path d="M24 27l-7 9M24 27l7 9" />
    </svg>
  );
}

function GreenTimeMotif() {
  return (
    <svg viewBox="0 0 48 48" className="h-6 w-6" aria-hidden="true">
      <circle cx="31" cy="15" r="6.5" fill="#f1c462" fillOpacity="0.55" />
      <path
        d="M15 33h16.5a5.5 5.5 0 0 0 .5-11 7.5 7.5 0 0 0-14.3-2.1A5.5 5.5 0 0 0 15 33z"
        fill="#e89058"
      />
    </svg>
  );
}

const handouts = [
  {
    href: "/for-classrooms/handout",
    eyebrow: "90-second reset",
    title: "Brain Break board",
    blurb:
      "How to run the board reset, when to use it, and what makes it safe for school.",
    accent: "#0e8a8a",
    tileBg: "bg-[#0e8a8a]/10",
    motif: <BrainBreakMotif />,
  },
  {
    href: "/for-classrooms/handout/green-time",
    eyebrow: "5-minute settle",
    title: "Green time cards",
    blurb:
      "How the make-then-rest cards work, the quiet slots they fit, and why they stay screen-free.",
    accent: "#a35d22",
    tileBg: "bg-[#f0a35f]/15",
    motif: <GreenTimeMotif />,
  },
];

export default function HandoutsPage() {
  return (
    <PageShell maxWidth="md">
      <article className="mx-auto w-full max-w-2xl space-y-8 py-4 sm:py-8">
        <section className="space-y-4">
          <span className="inline-flex items-center rounded-full bg-[#ffd84a]/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a6a00]">
            Early preview
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--color-primary)] sm:text-4xl">
            Classroom handouts
          </h1>
          <p className="text-lg leading-8 text-[color:var(--color-foreground)]/88">
            A one-page intro to each classroom tool. Open one, print it to paper
            or PDF, or hand it to a teacher.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {handouts.map((h) => (
            <a
              key={h.href}
              href={h.href}
              className="group flex items-center gap-4 rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[color:var(--color-foreground)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2"
            >
              <span
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${h.tileBg}`}
              >
                {h.motif}
              </span>
              <span className="min-w-0">
                <span
                  className="block text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: h.accent }}
                >
                  {h.eyebrow}
                </span>
                <span className="block text-base font-semibold text-[color:var(--color-primary)]">
                  {h.title}
                </span>
                <span className="mt-0.5 block text-sm leading-snug text-[color:var(--color-foreground)]/70">
                  {h.blurb}
                </span>
              </span>
            </a>
          ))}
        </section>

        <p className="text-sm text-[color:var(--color-foreground)]/60">
          <Link
            href="/for-classrooms"
            className="font-medium text-[color:var(--color-primary)] underline underline-offset-2 hover:text-[color:var(--color-accent)]"
          >
            Back to Tiny Pauses for classrooms
          </Link>
        </p>
      </article>
    </PageShell>
  );
}
