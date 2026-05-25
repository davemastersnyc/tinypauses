import Link from "next/link";
import { PrintButton } from "./recipes/print-button";

type Step = { n: string; title: string; body: string };

export type HandoutContent = {
  title: string;
  subtitle: string;
  accent: string;
  deep: string;
  lead: string;
  steps: Step[];
  urlLabel: string;
  url: string;
  tip: string;
  moments: string;
  safe: string;
  askTitle: string;
  askBody: string;
};

export function HandoutSheet({ content }: { content: HandoutContent }) {
  const { accent, deep } = content;
  return (
    <main className="handout-sheet min-h-screen bg-[radial-gradient(140%_120%_at_50%_0%,#f4fbfb_0%,#eef4f3_55%,#e7efe9_100%)] px-5 py-8 print:bg-white print:p-0">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-8 print:hidden">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#ffd84a]/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a6a00]">
              Early preview
            </span>
            <Link
              href="/for-classrooms"
              className="text-xs text-[color:var(--color-foreground)]/55 underline underline-offset-2 hover:text-[color:var(--color-foreground)]"
            >
              Back
            </Link>
          </div>
          <div className="mt-4">
            <PrintButton label="Print this page" />
          </div>
        </header>

        <article className="rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-white p-7 shadow-[var(--shadow-soft)] print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <div className="flex items-baseline justify-between gap-3 border-b border-[color:var(--color-border-subtle)] pb-4">
            <div>
              <h1
                className="text-3xl font-semibold tracking-tight"
                style={{ color: deep }}
              >
                {content.title}
              </h1>
              <p className="mt-1 text-base font-medium" style={{ color: accent }}>
                {content.subtitle}
              </p>
            </div>
            <span
              className="shrink-0 text-sm font-semibold"
              style={{ color: accent }}
            >
              Tiny Pauses
            </span>
          </div>

          <p className="mt-5 text-base leading-7 text-[color:var(--color-foreground)]/85">
            {content.lead}
          </p>

          <ol className="mt-5 space-y-2.5">
            {content.steps.map((s) => (
              <li key={s.n} className="flex gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: accent }}
                >
                  {s.n}
                </span>
                <span>
                  <span className="block font-semibold text-[color:var(--color-primary)]">
                    {s.title}
                  </span>
                  <span className="block text-sm leading-relaxed text-[color:var(--color-foreground)]/75">
                    {s.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <div
            className="mt-5 rounded-2xl border-2 border-dashed px-5 py-3.5 text-center"
            style={{ borderColor: `${accent}55` }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-foreground)]/55">
              {content.urlLabel}
            </p>
            <p
              className="mt-1 text-xl font-bold tracking-tight"
              style={{ color: deep }}
            >
              {content.url}
            </p>
          </div>

          <p className="mt-3.5 text-sm leading-relaxed text-[color:var(--color-foreground)]/70">
            <span className="font-semibold text-[color:var(--color-primary)]">
              Tip:
            </span>{" "}
            {content.tip}
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 print:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-foreground)]/55">
                Good moments
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-foreground)]/80">
                {content.moments}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-foreground)]/55">
                Safe for school
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-foreground)]/80">
                {content.safe}
              </p>
            </div>
          </div>

          <div
            className="mt-5 rounded-2xl px-5 py-3.5"
            style={{ backgroundColor: `${accent}0f` }}
          >
            <p className="font-semibold" style={{ color: deep }}>
              {content.askTitle}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-foreground)]/80">
              {content.askBody}
            </p>
          </div>

          <p className="mt-5 border-t border-[color:var(--color-border-subtle)] pt-3 text-xs leading-5 text-[color:var(--color-foreground)]/50">
            Tiny Pauses is not medical advice. A small, kind tool to help kids
            pause and notice how they feel. tinypauses.com
          </p>
        </article>
      </div>
    </main>
  );
}
