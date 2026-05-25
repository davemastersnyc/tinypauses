"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { recipes, type Kind, type Recipe } from "../recipes-data";

// Glow colors tuned for projection on a wall, not a screen: deep field, and
// accents that survive a soft, ambient-lit room. Amber rather than yellow,
// coral rather than orange, so they read calm instead of loud.
const glowByKind: Record<Kind, string> = {
  pause: "#5fd0d0",
  "letting-go": "#74d6a0",
  reflect: "#f1c462",
  kindness: "#f0936a",
};

const INK = "#f2efe6"; // warm off-white, never pure white (glares when projected)

type Zone = "any" | "buzzing" | "tense" | "flat";

// Teacher's optional read of the room. Picking one narrows the menu to the
// recipe kinds that fit, then kids still choose their own card from what is
// left. Default "any" keeps the free pick. Labels mirror the Brain Break dial.
const zones: { key: Zone; label: string; kinds: Kind[] | null; note: string }[] = [
  { key: "any", label: "Any", kinds: null, note: "Green time. Pick one." },
  { key: "buzzing", label: "Buzzing", kinds: ["pause"], note: "For a buzzing room. Pick one to settle." },
  { key: "tense", label: "Tense", kinds: ["letting-go"], note: "For a tense room. Pick one to let go." },
  { key: "flat", label: "Flat", kinds: ["reflect", "kindness"], note: "For a flat room. Pick one for a lift." },
];

function LanternOrb({ color, size, delay }: { color: string; size: string; delay?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`lantern-orb block rounded-full ${size}`}
      style={{
        background: `radial-gradient(circle, ${color} 0%, ${color}aa 38%, ${color}22 70%, ${color}00 100%)`,
        boxShadow: `0 0 50px ${color}66`,
        animationDelay: delay,
      }}
    />
  );
}

export function RecipeBoard() {
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [zone, setZone] = useState<Zone>("any");

  const activeZone = zones.find((z) => z.key === zone) ?? zones[0];
  const filtered = activeZone.kinds
    ? recipes.filter((r) => activeZone.kinds!.includes(r.kind))
    : recipes;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="ambient-dusk relative min-h-screen overflow-hidden">
      <div className="relative z-10 flex h-screen flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between text-[13px]">
          <span className="inline-flex items-center gap-2" style={{ color: `${INK}99` }}>
            Green time
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ background: "rgba(242,239,230,0.12)", color: `${INK}cc` }}
            >
              Preview
            </span>
          </span>
          <span className="flex items-center gap-4" style={{ color: `${INK}80` }}>
            <Link href="/for-classrooms/recipes" className="underline underline-offset-2 hover:opacity-100">
              Cards
            </Link>
            <Link href="/for-classrooms" className="underline underline-offset-2 hover:opacity-100">
              Exit
            </Link>
          </span>
        </div>

        {selected ? (
          <div className="board-step-enter flex flex-1 flex-col items-center justify-center text-center">
            <LanternOrb color={glowByKind[selected.kind]} size="h-20 w-20 sm:h-24 sm:w-24" />
            <h1
              className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl"
              style={{ color: INK }}
            >
              {selected.title}
            </h1>

            <div className="mt-9 max-w-3xl space-y-7">
              <div>
                <p
                  className="text-sm font-bold uppercase tracking-[0.2em]"
                  style={{ color: glowByKind[selected.kind] }}
                >
                  Make
                </p>
                <p className="mt-1 text-2xl leading-snug sm:text-3xl" style={{ color: `${INK}f2` }}>
                  {selected.make}
                </p>
              </div>
              <div>
                <p
                  className="text-sm font-bold uppercase tracking-[0.2em]"
                  style={{ color: glowByKind[selected.kind] }}
                >
                  Rest
                </p>
                <p className="mt-1 text-2xl leading-snug sm:text-3xl" style={{ color: `${INK}f2` }}>
                  {selected.rest}
                </p>
              </div>
            </div>

            <p className="mt-9 text-lg italic sm:text-xl" style={{ color: `${INK}80` }}>
              Makes: {selected.makes}
            </p>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-10 rounded-[var(--radius-pill)] border px-6 py-2.5 text-sm font-semibold transition hover:bg-white/10"
              style={{ borderColor: `${INK}40`, color: INK }}
            >
              Pick another
            </button>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
            <p className="mb-5 text-center text-2xl font-medium sm:text-3xl" style={{ color: `${INK}cc` }}>
              {activeZone.note}
            </p>

            <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
              {zones.map((z) => {
                const on = z.key === zone;
                return (
                  <button
                    key={z.key}
                    type="button"
                    onClick={() => setZone(z.key)}
                    aria-pressed={on}
                    className="rounded-full border px-4 py-1.5 text-sm font-medium transition"
                    style={
                      on
                        ? { borderColor: `${INK}cc`, background: `${INK}1f`, color: INK }
                        : { borderColor: `${INK}33`, color: `${INK}99` }
                    }
                  >
                    {z.label}
                  </button>
                );
              })}
            </div>

            <div
              className="flex w-full max-w-5xl flex-wrap items-center justify-center gap-4 sm:gap-5"
              style={{ maxHeight: "58vh" }}
            >
              {filtered.map((recipe, i) => {
                const glow = glowByKind[recipe.kind];
                return (
                  <button
                    key={recipe.title}
                    type="button"
                    onClick={() => setSelected(recipe)}
                    className="flex aspect-[6/5] w-[44%] max-w-[240px] flex-col items-center justify-center gap-3 rounded-3xl border p-4 text-center transition duration-500 hover:-translate-y-1 sm:w-[22%]"
                    style={{
                      borderColor: `${glow}55`,
                      background: `radial-gradient(120% 100% at 50% 0%, ${glow}26 0%, rgba(7,38,38,0.45) 72%)`,
                      boxShadow: `0 0 55px ${glow}1f, inset 0 0 45px ${glow}14`,
                    }}
                  >
                    <LanternOrb color={glow} size="h-11 w-11 sm:h-14 sm:w-14" delay={`${i * 0.35}s`} />
                    <span className="text-lg font-semibold leading-tight sm:text-xl" style={{ color: INK }}>
                      {recipe.title}
                    </span>
                    <span className="text-xs leading-snug sm:text-sm" style={{ color: `${INK}66` }}>
                      {recipe.makes}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-7 text-center text-xs" style={{ color: `${INK}55` }}>
              Teacher picks the room. Kids pick the card.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
