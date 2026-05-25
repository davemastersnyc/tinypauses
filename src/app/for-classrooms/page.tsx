import type { Metadata } from "next";
import { BrandButton, BrandCard, PageShell } from "../ui";
import { TeacherPilotForm } from "../teacher-pilot-form";

export const metadata: Metadata = {
  title: "Tiny Pauses for classrooms",
  description:
    "An early-preview, board-friendly version of Tiny Pauses for teachers: 90-second resets for after recess, before tests, and noisy transitions. Try the board preview and help shape it. No student accounts, no ads, no tracking kids.",
};

export default function ForClassroomsPage() {
  return (
    <PageShell maxWidth="md">
      <article className="mx-auto w-full max-w-2xl space-y-10 py-4 sm:py-8">
        <section className="space-y-4">
          <span className="inline-flex items-center rounded-full bg-[#ffd84a]/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a6a00]">
            Early preview
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--color-primary)] sm:text-4xl">
            Classroom Brain Breaks, in preview.
          </h1>
          <p className="text-lg leading-8 text-[color:var(--color-foreground)]/88">
            A simple, board-friendly version of Tiny Pauses for teachers:
            ninety-second resets for after recess, before tests, noisy
            transitions, and big feelings. There is an early version you can put
            on the board right now.
          </p>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            Tiny Pauses began as a tool for one kid at a time. This whole-class
            version is the next step, and it is in early mode. We would rather
            build it with teachers than guess, so try the preview and tell us
            what works.
          </p>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
            <BrandButton href="/for-classrooms/board" variant="primary">
              Open the board preview
            </BrandButton>
            <BrandButton href="/session" variant="secondary">
              Try Tiny Pauses as a student
            </BrandButton>
          </div>
          <div className="pt-1">
            <TeacherPilotForm />
          </div>
        </section>

        <section className="rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-soft)] px-5 py-4">
          <p className="text-base font-semibold text-[color:var(--color-primary)]">
            No student accounts. No ads. No tracking kids. No streaks.
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-foreground)]/72">
            Designed for grades 4-6 (kids 9-12). Nothing for kids to log into,
            and nothing sold.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            What we are building
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <BrandCard tone="muted">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-[color:var(--color-primary)]/85">
                  Built for the board
                </p>
                <span className="rounded-full bg-[#0e8a8a]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0e8a8a]">
                  Preview
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-foreground)]/75">
                A view designed for smartboards and projectors. Quiet by
                default, with sound optional, so you can run it from the front of
                the room.
              </p>
            </BrandCard>
            <BrandCard tone="muted">
              <p className="text-sm font-semibold text-[color:var(--color-primary)]/85">
                Short enough for transitions
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-foreground)]/75">
                Ninety seconds start to finish. Long enough to settle the room,
                short enough to fit between activities.
              </p>
            </BrandCard>
            <BrandCard tone="muted">
              <p className="text-sm font-semibold text-[color:var(--color-primary)]/85">
                Shaped by teacher feedback
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-foreground)]/75">
                We are building it around real classrooms: grade level, class
                size, and the moments you would actually use it.
              </p>
            </BrandCard>
          </div>
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
            before slow breaths, the same movement-then-breath order therapists
            use.
          </p>
        </section>

        <section className="space-y-4 rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-soft)] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            Help us build the right thing
          </h2>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            The board mode is in early mode. If you teach kids 9-12, try it and
            tell us your grade, class size, school setting, and when you would
            actually use it. We will fold it into how we build, and bring you in
            early.
          </p>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
            <BrandButton href="/for-classrooms/board" variant="primary">
              Open the board preview
            </BrandButton>
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
