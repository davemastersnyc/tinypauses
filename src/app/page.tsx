export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 via-indigo-50 to-violet-50 px-4">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 py-16">
        <header className="space-y-4 text-center">
          <p className="inline-flex items-center rounded-full bg-white/70 px-4 py-1 text-xs font-medium uppercase tracking-wide text-sky-700 shadow-sm">
            PracticeApp · Tiny mindful moments
          </p>
          <h1 className="text-balance text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Take a tiny pause,{" "}
            <span className="text-sky-600">feel a little calmer.</span>
          </h1>
          <p className="mx-auto max-w-xl text-balance text-base text-slate-700 sm:text-lg">
            Simple, kid-friendly prompts that help 9–12 year olds (and their
            grown‑ups) breathe, notice, and reset in just a minute or two.
          </p>
        </header>

        <section className="flex flex-col gap-4 rounded-3xl bg-white/80 p-6 shadow-lg shadow-sky-100 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-8">
          <div className="space-y-2 text-sm text-slate-700 sm:text-base">
            <p className="font-medium text-slate-900">
              Ready for a mindful moment?
            </p>
            <p>
              Try a one‑off prompt, or log in to keep a gentle record of your
              child&apos;s practice over time.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/session"
              className="inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-sky-200 transition hover:bg-sky-700 hover:shadow-lg"
            >
              Start a mindful moment
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-white px-6 py-3 text-sm font-semibold text-sky-800 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
            >
              Log in to keep track
            </a>
          </div>
        </section>

        <section className="grid gap-4 text-sm text-slate-700 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              For kids 9–12
            </p>
            <p className="mt-1">
              Short, concrete prompts written for upper‑elementary and middle
              schoolers. No jargon, no lectures.
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
              One tiny step
            </p>
            <p className="mt-1">
              Each moment has just one simple action—like noticing colors or
              sounds—so it feels doable even on busy days.
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Gentle tracking
            </p>
            <p className="mt-1">
              When you create a profile, PracticeApp quietly tracks moments over
              time—no streak shaming, just encouragement.
            </p>
          </div>
        </section>

        <footer className="mt-4 text-center text-xs text-slate-500">
          PracticeApp is not medical advice. It&apos;s a small, kind tool to
          help kids and adults pause and notice how they feel.
        </footer>
      </main>
    </div>
  );
}
