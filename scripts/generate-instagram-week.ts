import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { BrevoClient } from "@getbrevo/brevo";
import dotenv from "dotenv";
import {
  getActiveSeasonalWindow,
  pickSeasonalPrompt,
  pickWeeklyPrompt,
  buildSeasonalContext,
  buildWeeklyContext,
  type SeasonalWindowRow,
  type SpecialPromptRow,
} from "../src/lib/specialPrompts.ts";
import {
  getCalendarSpecialForDate,
  newlyCrossedMilestones,
  milestoneCardCopy,
  milestoneId,
  type MilestoneHit,
  type MilestoneKind,
} from "../src/lib/social.ts";
import {
  resolveCardTheme,
  drawCardIllustration,
} from "../src/lib/cardIllustrations.ts";
import { getSeasonalPalette } from "../src/lib/cardStyles.ts";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const BREVO_API_KEY = process.env.BREVO_API_KEY?.trim();
const BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL?.trim() || "hello@tinypauses.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim();

const SHOULD_SEND = process.argv.includes("--send");
const FORCE_MILESTONE = process.env.SOCIAL_FORCE_MILESTONE?.trim();

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const KIND_LABELS: Record<string, string> = {
  pause: "Just a pause",
  "letting-go": "Letting go",
  reflect: "Reflecting on today",
  kindness: "Kindness",
};

type PromptRow = {
  id: string;
  kind: string;
  title: string;
  body: string;
  step: string;
};

type Card = {
  filename: string;
  day: string;
  label: string;
  headline: string;
  title: string;
  body: string;
  step: string;
  specialType: "seasonal" | "weekly" | "milestone" | null;
  specialKey: string | null;
  illustrationKey: string | null;
};

const BRAND_HEADLINE = "I took a tiny pause today.";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function getSupabase(): { client: SupabaseClient | null; serviceRole: boolean } {
  if (!SUPABASE_URL) return { client: null, serviceRole: false };
  if (SUPABASE_SERVICE_ROLE_KEY) {
    return {
      client: createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
      serviceRole: true,
    };
  }
  if (SUPABASE_ANON_KEY) {
    return {
      client: createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
      serviceRole: false,
    };
  }
  return { client: null, serviceRole: false };
}

async function fetchRegularPrompts(client: SupabaseClient): Promise<PromptRow[]> {
  const { data, error } = await client
    .from("prompts")
    .select("id, kind, title, body, step")
    .eq("is_active", true)
    .in("kind", ["pause", "letting-go", "reflect", "kindness"]);
  if (error) throw error;
  return (data as PromptRow[]) ?? [];
}

async function fetchSeasonalData(client: SupabaseClient) {
  const [{ data: windows, error: windowsError }, { data: prompts, error: promptsError }] =
    await Promise.all([
      client.from("seasonal_windows").select("*").eq("active", true),
      client
        .from("special_prompts")
        .select("*")
        .eq("status", "active"),
    ]);
  if (windowsError) throw windowsError;
  if (promptsError) throw promptsError;
  return {
    windows: (windows as SeasonalWindowRow[]) ?? [],
    specialPrompts: (prompts as SpecialPromptRow[]) ?? [],
  };
}

async function fetchTotals(
  client: SupabaseClient,
): Promise<Record<MilestoneKind, number>> {
  const [{ count: pauses }, { count: subscribers }] = await Promise.all([
    client.from("moments").select("*", { count: "exact", head: true }),
    client.from("daily_subscribers").select("*", { count: "exact", head: true }),
  ]);
  return { pauses: pauses ?? 0, subscribers: subscribers ?? 0 };
}

async function fetchPostedMilestones(client: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await client
    .from("social_milestone_log")
    .select("milestone_kind, threshold");
  if (error) throw error;
  const posted = new Set<string>();
  for (const row of (data as { milestone_kind: MilestoneKind; threshold: number }[]) ?? []) {
    posted.add(milestoneId({ kind: row.milestone_kind, threshold: row.threshold }));
  }
  return posted;
}

// Deterministic rotation so each week starts at a different point in the pool.
function makeRegularPicker(prompts: PromptRow[], seed: number) {
  const sorted = [...prompts].sort((a, b) => a.id.localeCompare(b.id));
  let cursor = sorted.length ? seed % sorted.length : 0;
  return () => {
    if (!sorted.length) return null;
    const prompt = sorted[cursor % sorted.length];
    cursor += 1;
    return prompt;
  };
}

function buildDailyCards(
  now: Date,
  regularPrompts: PromptRow[],
  windows: SeasonalWindowRow[],
  specialPrompts: SpecialPromptRow[],
): Card[] {
  const seed = now.getFullYear() * 53 + Math.floor(now.getTime() / (7 * 86400000));
  const nextRegular = makeRegularPicker(regularPrompts, seed);
  const cards: Card[] = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDays(now, offset);
    const dayName = DAY_NAMES[date.getDay()];
    const filename = `${offset + 1}-${dayName}`;

    const calendarSpecial = getCalendarSpecialForDate(date);
    if (calendarSpecial) {
      cards.push({
        filename,
        day: dayName,
        label: calendarSpecial.label,
        headline: BRAND_HEADLINE,
        title: calendarSpecial.title,
        body: calendarSpecial.body,
        step: calendarSpecial.step,
        specialType: "seasonal",
        specialKey: calendarSpecial.key,
        illustrationKey: null,
      });
      continue;
    }

    const window = getActiveSeasonalWindow(windows, date);
    if (window) {
      const prompt = pickSeasonalPrompt(specialPrompts, window.key, date);
      if (prompt) {
        const context = buildSeasonalContext(window, prompt);
        cards.push({
          filename,
          day: dayName,
          label: context.badgeLabel,
          headline: BRAND_HEADLINE,
          title: prompt.name,
          body: prompt.body,
          step: prompt.tiny_step,
          specialType: "seasonal",
          specialKey: window.key,
          illustrationKey: context.illustrationKey,
        });
        continue;
      }
    }

    if (dayName === "sunday" || dayName === "monday") {
      const key = dayName === "sunday" ? "sunday-evening" : "monday-morning";
      const prompt = pickWeeklyPrompt(specialPrompts, key, date);
      if (prompt) {
        const context = buildWeeklyContext(key, prompt);
        cards.push({
          filename,
          day: dayName,
          label: context.badgeLabel,
          headline: BRAND_HEADLINE,
          title: prompt.name,
          body: prompt.body,
          step: prompt.tiny_step,
          specialType: "weekly",
          specialKey: key,
          illustrationKey: context.illustrationKey,
        });
        continue;
      }
    }

    const prompt = nextRegular();
    cards.push({
      filename,
      day: dayName,
      label: prompt ? (KIND_LABELS[prompt.kind] ?? "Mindful moment") : "Mindful moment",
      headline: BRAND_HEADLINE,
      title: prompt?.title ?? "Tiny pause",
      body: prompt?.body ?? "Take a small, kind moment for yourself right now.",
      step: prompt?.step ?? "Take three slow breaths.",
      specialType: null,
      specialKey: null,
      illustrationKey: null,
    });
  }

  return cards;
}

function buildMilestoneCards(hits: MilestoneHit[]): Card[] {
  return hits.map((hit) => {
    const copy = milestoneCardCopy(hit);
    return {
      filename: `milestone-${hit.kind}-${hit.threshold}`,
      day: `milestone (${hit.kind} ${hit.threshold})`,
      label: copy.label,
      headline: copy.headline,
      title: copy.title,
      body: copy.body,
      step: copy.step,
      specialType: "milestone" as const,
      specialKey: null,
      illustrationKey: null,
    };
  });
}

function parseForcedMilestone(raw: string | undefined): MilestoneHit | null {
  if (!raw) return null;
  const [kind, value] = raw.split(":");
  const threshold = Number(value);
  if ((kind !== "pauses" && kind !== "subscribers") || !Number.isFinite(threshold)) {
    return null;
  }
  return { kind, threshold };
}

async function renderCards(cards: Card[], outputDir: string) {
  const logoBuffer = fs.readFileSync(path.resolve("public/brand/LogoLockUp.png"));
  const logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  // Serialize the shared illustration drawer so the headless cards stay
  // identical to the in-app share card.
  const illustrationSource = drawCardIllustration.toString();
  const palette = getSeasonalPalette(new Date());

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  await page.setContent(
    "<!doctype html><html><body style='margin:0'><canvas id='card' width='1080' height='1080'></canvas></body></html>",
  );

  for (const card of cards) {
    const cardTheme =
      card.illustrationKey || resolveCardTheme(card.label, card.specialKey);
    await page.evaluate(
      async ({ cardData, logo, illustrationSource, cardTheme, palette }) => {
        const canvas = document.getElementById("card") as HTMLCanvasElement | null;
        if (!canvas) throw new Error("Card canvas element is missing.");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("2D canvas context is unavailable.");
        const size = 1080;
        const drawCardIllustration = new Function(
          "return (" + illustrationSource + ")",
        )();

        function drawRoundedRect(
          context: CanvasRenderingContext2D,
          x: number,
          y: number,
          width: number,
          height: number,
          radius: number,
        ) {
          const safeWidth = Math.max(0, width);
          const safeHeight = Math.max(0, height);
          if (!safeWidth || !safeHeight) return;
          const r = Math.max(0, Math.min(radius, safeWidth / 2, safeHeight / 2));
          context.beginPath();
          context.moveTo(x + r, y);
          context.arcTo(x + safeWidth, y, x + safeWidth, y + safeHeight, r);
          context.arcTo(x + safeWidth, y + safeHeight, x, y + safeHeight, r);
          context.arcTo(x, y + safeHeight, x, y, r);
          context.arcTo(x, y, x + safeWidth, y, r);
          context.closePath();
        }

        function badgeColorForCategory(category: string) {
          const lower = String(category).trim().toLowerCase();
          if (lower.includes("milestone")) return "#f97316";
          if (lower.includes("letting")) return "#ff2f92";
          if (lower.includes("reflect")) return "#ffd84a";
          if (lower.includes("kind")) return "#66cccc";
          if (lower.includes("pause")) return "#66cccc";
          return "#f97316";
        }

        // Seasonal background
        const gradient = ctx.createLinearGradient(0, 0, 0, size);
        gradient.addColorStop(0, palette.bgFrom);
        gradient.addColorStop(1, palette.bgTo);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        // Soft seasonal motif: two faint blooms drifting off the corners.
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = palette.motif;
        ctx.beginPath();
        ctx.arc(size * 0.02, size * 0.1, 150, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(size * 0.98, size * 0.92, 200, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = palette.panel;
        drawRoundedRect(ctx, 76, 76, size - 152, size - 152, 52);
        ctx.fill();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Real brand logo at the top
        const logoImage = new Image();
        const logoLoaded = await new Promise<boolean>((resolve) => {
          logoImage.onload = () => resolve(true);
          logoImage.onerror = () => resolve(false);
          logoImage.src = logo;
        });
        if (logoLoaded && logoImage.naturalWidth > 0) {
          const logoH = 150;
          const logoW = logoH * (logoImage.naturalWidth / logoImage.naturalHeight);
          ctx.drawImage(logoImage, size / 2 - logoW / 2, 84, logoW, logoH);
        } else {
          ctx.save();
          ctx.fillStyle = palette.inkSoft;
          ctx.font = "600 26px Inter, Avenir Next, Segoe UI, sans-serif";
          ctx.letterSpacing = "6px";
          ctx.fillText("TINY PAUSES", size / 2, 150);
          ctx.restore();
        }

        // Category badge
        const badgeLabel = cardData.label || "Mindful moment";
        const badgeColor = badgeColorForCategory(badgeLabel);
        ctx.font = "500 40px Inter, Avenir Next, Segoe UI, sans-serif";
        const badgeWidth = Math.max(240, ctx.measureText(badgeLabel).width + 86);
        const badgeX = (size - badgeWidth) / 2;
        const badgeY = 270;
        ctx.fillStyle = badgeColor;
        drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, 74, 37);
        ctx.fill();
        ctx.fillStyle = "#121826";
        ctx.fillText(badgeLabel, size / 2, badgeY + 38);

        // Illustration, scaled to anchor the card
        ctx.save();
        ctx.translate(size / 2, 500);
        ctx.scale(1.25, 1.25);
        ctx.translate(-(size / 2), -500);
        drawCardIllustration(ctx, size / 2, 500, cardTheme);
        ctx.restore();

        // Hierarchy: the specific moment leads, the brand line supports.
        const isMilestone = cardData.specialType === "milestone";
        const heroText = isMilestone
          ? cardData.headline || "Tiny pause"
          : cardData.title || "Tiny pause";
        const subText = isMilestone
          ? cardData.title || ""
          : "I took a tiny pause today.";

        ctx.fillStyle = palette.ink;
        ctx.font = "700 62px Inter, Avenir Next, Segoe UI, sans-serif";
        ctx.fillText(heroText, size / 2, 700);

        if (subText) {
          ctx.fillStyle = palette.inkSoft;
          ctx.font = "500 32px Inter, Avenir Next, Segoe UI, sans-serif";
          ctx.fillText(subText, size / 2, 760);
        }

        ctx.fillStyle = palette.inkSoft;
        ctx.font = "500 28px Inter, Avenir Next, Segoe UI, sans-serif";
        ctx.fillText("tinypauses.com", size / 2, 952);
      },
      { cardData: card, logo: logoDataUrl, illustrationSource, cardTheme, palette },
    );

    await page.screenshot({
      path: path.join(outputDir, `${card.filename}.png`),
      type: "png",
      clip: { x: 0, y: 0, width: 1080, height: 1080 },
    });
  }

  await browser.close();
}

function writeCaptions(cards: Card[], outputDir: string) {
  const text = cards
    .map(
      (card) =>
        `${card.day.toUpperCase()} (${card.filename}.png)\n${card.title}\n${card.body}\nYour tiny step: ${card.step}`,
    )
    .join("\n\n");
  fs.writeFileSync(path.join(outputDir, "captions.txt"), `${text}\n`, "utf8");
  return text;
}

async function deliverEmail(cards: Card[], outputDir: string, captions: string) {
  if (!SHOULD_SEND) {
    console.log(
      `Dry run: would email ${cards.length} cards to ${ADMIN_EMAIL ?? "(ADMIN_EMAIL unset)"}. Pass --send to deliver.`,
    );
    return;
  }
  if (!BREVO_API_KEY || !ADMIN_EMAIL) {
    console.warn("Skipping email: BREVO_API_KEY or ADMIN_EMAIL not set.");
    return;
  }

  const brevo = new BrevoClient({ apiKey: BREVO_API_KEY });
  const attachments = cards.map((card) => {
    const filePath = path.join(outputDir, `${card.filename}.png`);
    return {
      name: `${card.filename}.png`,
      content: fs.readFileSync(filePath).toString("base64"),
    };
  });

  const htmlCaptions = captions
    .split("\n")
    .map((line) => (line.trim() ? `<p style="margin:2px 0;">${line}</p>` : "<br/>"))
    .join("");

  await brevo.transactionalEmails.sendTransacEmail({
    sender: { email: BREVO_FROM_EMAIL, name: "Tiny Pauses" },
    to: [{ email: ADMIN_EMAIL }],
    subject: `Your Tiny Pauses Instagram week is ready (${cards.length} cards)`,
    htmlContent: `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1b2438;">
      <h2>This week's tiny pauses are attached and ready to post.</h2>
      ${htmlCaptions}
    </div>`,
    attachment: attachments,
  });
  console.log(`Emailed ${cards.length} cards to ${ADMIN_EMAIL}.`);
}

async function main() {
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const outputDir = path.resolve(`assets/instagram-week-${stamp}`);
  fs.mkdirSync(outputDir, { recursive: true });
  for (const name of fs.existsSync(outputDir) ? fs.readdirSync(outputDir) : []) {
    if (name.endsWith(".png") || name.endsWith(".txt")) {
      fs.rmSync(path.join(outputDir, name), { force: true });
    }
  }

  const { client, serviceRole } = getSupabase();

  let regularPrompts: PromptRow[] = [];
  let windows: SeasonalWindowRow[] = [];
  let specialPrompts: SpecialPromptRow[] = [];
  if (client) {
    try {
      regularPrompts = await fetchRegularPrompts(client);
      const seasonal = await fetchSeasonalData(client);
      windows = seasonal.windows;
      specialPrompts = seasonal.specialPrompts;
    } catch (error) {
      console.warn("Could not load prompts from Supabase, using fallback copy.", error);
    }
  } else {
    console.warn("Supabase not configured; generating with fallback copy only.");
  }

  const dailyCards = buildDailyCards(now, regularPrompts, windows, specialPrompts);

  let milestoneHits: MilestoneHit[] = [];
  const forced = parseForcedMilestone(FORCE_MILESTONE);
  if (forced) {
    milestoneHits = [forced];
  } else if (client && serviceRole) {
    try {
      const totals = await fetchTotals(client);
      const posted = await fetchPostedMilestones(client);
      milestoneHits = newlyCrossedMilestones(totals, posted);
    } catch (error) {
      console.warn("Could not evaluate milestones; skipping milestone cards.", error);
    }
  } else if (client) {
    console.warn("No service-role key; skipping milestones (counts need elevated access).");
  }

  const cards = [...dailyCards, ...buildMilestoneCards(milestoneHits)];

  await renderCards(cards, outputDir);
  const captions = writeCaptions(cards, outputDir);
  await deliverEmail(cards, outputDir, captions);

  // Record posted milestones so each fires only once (service-role + real send).
  if (SHOULD_SEND && !forced && client && serviceRole && milestoneHits.length) {
    const { error } = await client.from("social_milestone_log").insert(
      milestoneHits.map((hit) => ({
        milestone_kind: hit.kind,
        threshold: hit.threshold,
      })),
    );
    if (error) console.error("Failed to record milestones in ledger.", error);
  }

  console.log(`Generated ${cards.length} cards in: ${outputDir}`);
}

main().catch((error) => {
  console.error("Failed to generate cards:", error);
  process.exitCode = 1;
});
