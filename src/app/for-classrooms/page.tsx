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

        <section className="space-y-4 rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-soft)] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            The classroom version is in the works
          </h2>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            We are building a teacher view, printable pause cards, and a simple
            way to run a pause for the whole room. If you teach kids 9-12 and
            want to help shape it, we would love to hear from you.
          </p>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
            <BrandButton href="/daily" variant="primary">
              Get a daily pause to try
            </BrandButton>
            <a
              href="mailto:hello@tinypauses.com?subject=Tiny%20Pauses%20for%20my%20classroom"
              className="text-sm font-medium text-[color:var(--color-primary)] underline decoration-[color:var(--color-foreground)]/30 underline-offset-2 hover:text-[color:var(--color-accent)]"
            >
              Email us about your classroom
            </a>
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
