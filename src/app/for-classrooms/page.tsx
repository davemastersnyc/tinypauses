import type { Metadata } from "next";
import { BrandButton, BrandCard, PageShell } from "../ui";

export const metadata: Metadata = {
  title: "Tiny Pauses for classrooms",
  description:
    "Ninety-second resets for the whole class. Run a calm pause or a Brain Break on the board in about a minute. No kid logins, no data collected on children.",
};

export default function ForClassroomsPage() {
  return (
    <PageShell maxWidth="md">
      <article className="mx-auto w-full max-w-2xl space-y-10 py-4 sm:py-8">
        <section className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--color-primary)] sm:text-4xl">
            Tiny Pauses for classrooms
          </h1>
          <p className="text-lg leading-8 text-[color:var(--color-foreground)]/88">
            Ninety-second resets for a room full of big feelings.
          </p>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            Tiny Pauses started as a tool for one kid at a time. Teachers kept
            telling us the same thing: the whole class needs this too. Right
            after recess, before a test, or any moment the room gets restless.
          </p>
        </section>

        <section className="rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-soft)] px-5 py-4">
          <p className="text-base font-semibold text-[color:var(--color-primary)]">
            No student accounts. No ads. No tracking kids. No streaks.
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-foreground)]/72">
            Nothing for kids to log into, and nothing sold. You run it, the room
            follows along.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            How it helps in class
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <BrandCard tone="muted">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-[color:var(--color-primary)]/85">
                  Run it on the board
                </p>
                <span className="rounded-full bg-[#ffd84a]/35 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a6a00]">
                  Coming soon
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-foreground)]/75">
                Soon you will pick a pause or a Brain Break, press play, and the
                whole room will follow along hands-free in about ninety seconds.
              </p>
            </BrandCard>
            <BrandCard tone="muted">
              <p className="text-sm font-semibold text-[color:var(--color-primary)]/85">
                Nothing to set up
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-foreground)]/75">
                No logins for kids, nothing to manage per student, and no data
                collected on children.
              </p>
            </BrandCard>
            <BrandCard tone="muted">
              <p className="text-sm font-semibold text-[color:var(--color-primary)]/85">
                Movement first
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-foreground)]/75">
                Brain Break uses shaking, stomping, and squeezing before breath
                work, the same somatic order therapists use.
              </p>
            </BrandCard>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            When to use it
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
        </section>

        <section className="space-y-4 rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-soft)] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            Join the teacher pilot
          </h2>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            The whole-class board mode is still being built. If you teach kids
            9-12, you can be one of the first classrooms to try it and help shape
            how it works. Tell us a little about your room and we will be in
            touch.
          </p>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
            <BrandButton
              href="mailto:hello@tinypauses.com?subject=Tiny%20Pauses%20teacher%20pilot&body=Grade%20I%20teach%3A%0AClass%20size%3A%0AWhat%20I%20would%20use%20it%20for%3A"
              variant="primary"
            >
              Join the pilot
            </BrandButton>
            <BrandButton href="/daily" variant="secondary">
              Try a daily pause first
            </BrandButton>
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
