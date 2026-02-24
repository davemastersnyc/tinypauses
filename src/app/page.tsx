import { BrandButton, BrandCard, BrandPill, PageShell } from "./ui";

export default function Home() {
  return (
    <PageShell maxWidth="lg">
      <header className="space-y-4 text-center">
        <BrandPill>Practice · Tiny mindful moments</BrandPill>
        <h1 className="text-balance text-4xl font-semibold leading-tight text-[color:var(--color-primary)] sm:text-5xl">
          2–3 minutes.{" "}
          <span className="text-[color:var(--color-accent)]">
            Just for you.
          </span>
        </h1>
        <p className="mx-auto max-w-xl text-balance text-base text-[color:var(--color-foreground)]/80 sm:text-lg">
          No writing. No talking. Just a tiny pause to help your brain and body
          reset, one gentle moment at a time.
        </p>
      </header>

      <BrandCard>
        <div className="flex flex-col gap-4 items-stretch sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="space-y-2 text-sm text-[color:var(--color-foreground)]/85 sm:text-base">
            <p className="font-medium text-[color:var(--color-primary)]">
              Try today&apos;s practice.
            </p>
            <p>
              Pick a quick prompt, take a tiny pause, and notice how you feel.
              You can keep track over time, or just visit when you need a
              breather.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <BrandButton href="/session" variant="primary">
              Start a mindful moment
            </BrandButton>
            <BrandButton href="/login" variant="secondary">
              Log in to keep track
            </BrandButton>
          </div>
        </div>
      </BrandCard>

      <section className="grid gap-4 text-sm text-[color:var(--color-foreground)]/85 sm:grid-cols-3">
        <BrandCard tone="muted">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-primary)]/75">
            For kids 9–12 (and their grown‑ups)
          </p>
          <p className="mt-1">
            Short, concrete prompts written in plain, kind language. No
            lectures, no pressure—just small steps that feel doable.
          </p>
        </BrandCard>
        <BrandCard tone="muted">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-primary)]/75">
            One tiny step at a time
          </p>
          <p className="mt-1">
            Each practice has a single simple action—like noticing colors or
            taking three slow breaths—so it works even on busy days.
          </p>
        </BrandCard>
        <BrandCard tone="muted">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-primary)]/75">
            Gentle, no-streak tracking
          </p>
          <p className="mt-1">
            When you log in, Practice keeps a soft record of your moments. No
            streaks, no shaming—just a quiet way to see your tiny wins.
          </p>
        </BrandCard>
      </section>

      <footer className="mt-2 text-center text-xs text-[color:var(--color-foreground)]/60">
        Practice is not medical advice. It&apos;s a small, kind tool to help
        kids and adults pause and notice how they feel.
      </footer>
    </PageShell>
  );
}
