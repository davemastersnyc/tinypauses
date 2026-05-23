// Seasonal card styling. The look rotates with the calendar season; the legacy
// flat design is kept as a fallback. Palettes are plain data so they can be
// passed straight into the headless generator (no function serialization).

export type Season = "spring" | "summer" | "autumn" | "winter";

export type SeasonalPalette = {
  season: Season;
  bgFrom: string;
  bgTo: string;
  panel: string;
  ink: string;
  inkSoft: string;
  motif: string;
};

export function getSeason(date: Date): Season {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

const PALETTES: Record<Season, Omit<SeasonalPalette, "season">> = {
  spring: {
    bgFrom: "#f1f6e9",
    bgTo: "#e2efd4",
    panel: "rgba(255,255,255,0.42)",
    ink: "#2c3a26",
    inkSoft: "rgba(44,58,38,0.66)",
    motif: "#cfe3b3",
  },
  summer: {
    bgFrom: "#fff3da",
    bgTo: "#ffe4b8",
    panel: "rgba(255,255,255,0.44)",
    ink: "#46361f",
    inkSoft: "rgba(70,54,31,0.66)",
    motif: "#ffd693",
  },
  autumn: {
    bgFrom: "#fbe7d2",
    bgTo: "#f3cfa3",
    panel: "rgba(255,255,255,0.42)",
    ink: "#46301c",
    inkSoft: "rgba(70,48,28,0.66)",
    motif: "#e9b885",
  },
  winter: {
    bgFrom: "#eef3f7",
    bgTo: "#dce8ef",
    panel: "rgba(255,255,255,0.52)",
    ink: "#2a3540",
    inkSoft: "rgba(42,53,64,0.66)",
    motif: "#c6d8e4",
  },
};

export function getSeasonalPalette(date: Date): SeasonalPalette {
  const season = getSeason(date);
  return { season, ...PALETTES[season] };
}

// The active card style. "legacy" is the original flat design, kept as a
// fallback; "season" is the current default. Future styles slot in here.
export type CardStyleName = "legacy" | "season";

export function resolveCardStyleName(): CardStyleName {
  return "season";
}
