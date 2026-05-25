import type { Metadata } from "next";
import { BrandButton, BrandCard, PageShell } from "../ui";
import { TeacherPilotForm } from "../teacher-pilot-form";

export const metadata: Metadata = {
  title: "Tiny Pauses for classrooms",
  description:
    "Two early-preview classroom tools from Tiny Pauses: a 90-second Brain Break board to settle a buzzing room, and 5-minute green time recipe cards for the quiet slot. Try both and help shape them. No student accounts, no ads, no tracking kids.",
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

const heroTools = [
  {
    href: "/for-classrooms/board",
    eyebrow: "90-second reset",
    title: "Brain Break board",
    blurb: "Settle a buzzing room with movement, then breath.",
    accent: "#0e8a8a",
    tileBg: "bg-[#0e8a8a]/10",
    motif: <BrainBreakMotif />,
  },
  {
    href: "/for-classrooms/recipes",
    eyebrow: "5-minute settle",
    title: "Green time cards",
    blurb: "Make a small thing, then rest with it.",
    accent: "#a35d22",
    tileBg: "bg-[#f0a35f]/15",
    motif: <GreenTimeMotif />,
  },
];

export default function ForClassroomsPage() {
  return (
    <PageShell maxWidth="md">
      <article className="mx-auto w-full max-w-2xl space-y-10 py-4 sm:py-8">
        <section className="space-y-4">
          <span className="inline-flex items-center rounded-full bg-[#ffd84a]/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a6a00]">
            Early preview
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--color-primary)] sm:text-4xl">
            Classroom resets, in preview.
          </h1>
          <p className="text-lg leading-8 text-[color:var(--color-foreground)]/88">
            Two early tools for teachers, both built on Tiny Pauses. Try them
            both right now.
          </p>
          <div className="grid gap-3 pt-1 sm:grid-cols-2">
            {heroTools.map((tool) => (
              <a
                key={tool.href}
                href={tool.href}
                className="group flex items-center gap-4 rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[color:var(--color-foreground)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2"
              >
                <span
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${tool.tileBg}`}
                >
                  {tool.motif}
                </span>
                <span className="min-w-0">
                  <span
                    className="block text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: tool.accent }}
                  >
                    {tool.eyebrow}
                  </span>
                  <span className="block text-base font-semibold text-[color:var(--color-primary)]">
                    {tool.title}
                  </span>
                  <span className="mt-0.5 block text-sm leading-snug text-[color:var(--color-foreground)]/70">
                    {tool.blurb}
                  </span>
                </span>
              </a>
            ))}
          </div>
          <div className="pt-1">
            <TeacherPilotForm />
          </div>
          <p className="text-sm text-[color:var(--color-foreground)]/60">
            Or{" "}
            <a
              href="/session"
              className="font-medium text-[color:var(--color-primary)] underline underline-offset-2 hover:text-[color:var(--color-accent)]"
            >
              try Tiny Pauses as a student
            </a>
            .
          </p>
        </section>

        <section className="rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-soft)] px-5 py-4">
          <p className="text-base font-semibold text-[color:var(--color-primary)]">
            No student accounts. No ads. No tracking kids. No streaks.
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-foreground)]/72">
            Designed for grades 3-6 (ages 8-12). Nothing for kids to log into,
            and nothing sold.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            Two ways to try it
          </h2>
          <p className="text-sm leading-7 text-[color:var(--color-foreground)]/70">
            The room has two kinds of moments. Each tool is for one of them.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <BrandCard tone="muted">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-[color:var(--color-primary)]">
                  Brain Break board
                </p>
                <span className="rounded-full bg-[#0e8a8a]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0e8a8a]">
                  Preview
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-foreground)]/55">
                90-second reset, for a buzzing room
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-foreground)]/75">
                A hands-free, movement-then-breath reset you lead from the front
                of the room. Pick where the room is, press go, lead with your
                body. Quiet by default.
              </p>
              <div className="mt-4">
                <BrandButton href="/for-classrooms/board" variant="primary">
                  Open the board
                </BrandButton>
              </div>
            </BrandCard>
            <BrandCard tone="muted">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-[color:var(--color-primary)]">
                  Green time cards
                </p>
                <span className="rounded-full bg-[#0e8a8a]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0e8a8a]">
                  Preview
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-foreground)]/55">
                5-minute settle, for the quiet slot
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-foreground)]/75">
                Make-then-rest recipe cards. A kid picks one, makes a small
                thing, then settles with it. Print a set, or project the board
                menu.
              </p>
              <div className="mt-4">
                <BrandButton href="/for-classrooms/recipes" variant="primary">
                  See the cards
                </BrandButton>
              </div>
            </BrandCard>
          </div>
          <p className="text-sm leading-7 text-[color:var(--color-foreground)]/65">
            Want a one-page intro to print or hand a colleague?{" "}
            <a
              href="/for-classrooms/handouts"
              className="font-medium text-[color:var(--color-primary)] underline underline-offset-2 hover:text-[color:var(--color-accent)]"
            >
              Open the classroom handouts
            </a>
            .
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            When you would use it
          </h2>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {[
              "Right after recess, when bodies are still buzzing",
              "Before a test, when nerves are running high",
              "During a noisy transition between subjects",
              "After a conflict, when the room feels tense",
              "Any time the room gets wiggly and restless",
              "When one kid needs a reset and the whole class could use one too",
            ].map((moment) => (
              <li
                key={moment}
                className="flex items-start gap-2.5 rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-soft)] px-4 py-3 text-sm leading-relaxed text-[color:var(--color-foreground)]/85"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[color:var(--color-accent)]"
                />
                {moment}
              </li>
            ))}
          </ul>
          <p className="text-sm leading-7 text-[color:var(--color-foreground)]/65">
            Each Brain Break moves through shaking, stomping, and squeezing
            before slow breaths, an order often used in regulation work.
          </p>
        </section>

        <section className="space-y-4 rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-soft)] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            Help us build the right thing
          </h2>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            Both tools are in early mode. If you teach these grades, try them
            and tell us what works and what does not. We will fold it into how we
            build, and bring you in early.
          </p>
          <div className="pt-1">
            <TeacherPilotForm />
          </div>
        </section>

        <p className="pt-2 text-sm leading-7 text-[color:var(--color-foreground)]/58">
          Tiny Pauses is not medical advice. It is a small, kind tool to help
          kids pause and notice how they feel.
        </p>
      </article>
    </PageShell>
  );
}
