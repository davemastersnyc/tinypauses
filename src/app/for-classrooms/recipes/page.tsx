import type { Metadata } from "next";
import Link from "next/link";
import { PrintButton } from "./print-button";

export const metadata: Metadata = {
  title: "Green time recipe cards (preview)",
  description:
    "Printable, screen-free recipe cards for green time. Each one is make-then-rest: draw or fold a small thing, then settle with it. Built from Tiny Pauses prompts. No devices, no accounts, no tracking kids.",
  robots: { index: false, follow: false },
};

type Kind = "pause" | "letting-go" | "reflect" | "kindness";

const kindMeta: Record<Kind, { label: string; color: string; ink: string }> = {
  pause: { label: "Pause", color: "#66cccc", ink: "#0b6b6b" },
  "letting-go": { label: "Letting go", color: "#7edfaa", ink: "#1f7a4d" },
  reflect: { label: "Reflect", color: "#ffd84a", ink: "#8a6a00" },
  kindness: { label: "Kindness", color: "#f9a36a", ink: "#9a4a16" },
};

type Recipe = {
  title: string;
  kind: Kind;
  need: string;
  make: string;
  rest: string;
  makes: string;
};

// Each recipe is make-then-rest: a creative beat that produces a small object,
// then a still beat spent with it. The rest step echoes the wording of the
// matching Tiny Pauses prompt the app has already shipped (seed_prompts_40).
const recipes: Recipe[] = [
  {
    title: "Cloud Watching",
    kind: "pause",
    need: "paper, a pencil",
    make: "Draw a few clouds across your paper. Any shapes you like, soft and slow.",
    rest: "Pick your favorite. Breathe in for four, out for four, and watch it drift by in your mind.",
    makes: "a sky to rest your eyes on",
  },
  {
    title: "Square Breath",
    kind: "pause",
    need: "paper, a pencil",
    make: "Draw one big square. Go over the four lines a few times, slow.",
    rest: "Now trace it with just your eyes: in for four up one side, hold four, out for four down, hold four. One full square.",
    makes: "a shape that slows you down",
  },
  {
    title: "Color Count",
    kind: "pause",
    need: "paper, a colored pencil if you have one",
    make: "Pick one color. Hunt for it around the room and draw a small dot for each thing you find.",
    rest: "Look at your row of dots. Close your eyes for one slow breath, then open them slowly.",
    makes: "a calmer set of eyes",
  },
  {
    title: "Paper Boat",
    kind: "letting-go",
    need: "a small square of paper",
    make: "Fold a little paper boat, or draw one. Quietly give it one worry to carry.",
    rest: "Set it in front of you. Breathe out slowly three times and watch it drift away and out of sight.",
    makes: "one worry, sailing off",
  },
  {
    title: "Snow Globe",
    kind: "letting-go",
    need: "paper, a pencil",
    make: "Draw a snow globe. Fill it with dots for all the flakes swirling around in there.",
    rest: "Sit still for three breaths and watch the flakes settle to the bottom.",
    makes: "a settled snow globe",
  },
  {
    title: "Leaf on a Stream",
    kind: "letting-go",
    need: "paper, a pencil",
    make: "Draw a stream across your paper and one leaf floating on it. Rest a thought on the leaf.",
    rest: "Take three breaths. Each breath, picture the leaf floating a little farther away.",
    makes: "a thought, floating off",
  },
  {
    title: "Small Win",
    kind: "reflect",
    need: "paper, a pencil",
    make: "Draw one thing you handled today, even a tiny one.",
    rest: "Look at your drawing and replay the moment for ten slow seconds. Notice how it felt.",
    makes: "one good moment, kept",
  },
  {
    title: "Kindness Jar",
    kind: "kindness",
    need: "paper, a pencil",
    make: "Draw a jar. Inside it, draw or write one kind thing, something someone did for you, or you did for someone.",
    rest: "Add it to the jar in your mind and take one slow breath. It stays in there.",
    makes: "one kindness, kept",
  },
];

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const meta = kindMeta[recipe.kind];
  return (
    <article
      className="recipe-card flex break-inside-avoid flex-col rounded-2xl border border-[color:var(--color-border-subtle)] bg-white p-5"
      style={{ borderTopWidth: 6, borderTopColor: meta.color }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-[color:var(--color-primary)]">
          {recipe.title}
        </h2>
        <span
          className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{ backgroundColor: `${meta.color}33`, color: meta.ink }}
        >
          {meta.label}
        </span>
      </div>

      <p className="mt-1 text-xs text-[color:var(--color-foreground)]/55">
        About 5 minutes · You need: {recipe.need}
      </p>

      <div className="mt-4 space-y-3 text-sm leading-relaxed text-[color:var(--color-foreground)]/85">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: meta.ink }}>
            Make
          </p>
          <p className="mt-0.5">{recipe.make}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: meta.ink }}>
            Rest
          </p>
          <p className="mt-0.5">{recipe.rest}</p>
        </div>
      </div>

      <p className="mt-4 border-t border-dashed border-[color:var(--color-border-subtle)] pt-3 text-sm italic text-[color:var(--color-foreground)]/70">
        Makes: {recipe.makes}
      </p>
    </article>
  );
}

export default function RecipesPage() {
  return (
    <main className="recipe-sheet min-h-screen bg-[radial-gradient(140%_120%_at_50%_0%,#f4fbfb_0%,#eef4f3_55%,#e7efe9_100%)] px-5 py-8 print:bg-white print:p-0">
      <div className="mx-auto w-full max-w-4xl">
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
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--color-primary)] sm:text-4xl">
            Green time recipe cards
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-[color:var(--color-foreground)]/80">
            Screen-free cards for the quiet reset slot. Each one is the same
            shape as a Brain Break, make something, then settle with it. A kid
            picks a card, makes a small thing, then rests with it. No devices, no
            accounts, nothing to track.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--color-foreground)]/60">
            Print to paper or PDF, cut along the cards, and laminate a set for
            the room. This is a draft to test, so add, cut, or rewrite recipes
            freely.
          </p>
          <div className="mt-5">
            <PrintButton />
          </div>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 print:grid-cols-2 print:gap-4">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.title} recipe={recipe} />
          ))}
        </div>

        <p className="mt-10 text-center text-xs leading-6 text-[color:var(--color-foreground)]/45 print:hidden">
          Tiny Pauses is not medical advice. It is a small, kind tool to help
          kids pause and notice how they feel.
        </p>
      </div>
    </main>
  );
}
