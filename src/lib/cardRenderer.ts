export type WrapUpPeriod = "weekly" | "monthly" | "yearly";

export type WrapUpStats = {
  total_moments: number;
  total_days_with_moments: number;
  top_category?: string | null;
  mood_average?: number | null;
  mood_descriptor?: string | null;
  best_month?: string | null;
  closing_line?: string | null;
  day_flags?: boolean[] | null;
  month_day_flags?: boolean[] | null;
  week_flags?: boolean[] | null;
};

export type MomentCardMetadata = {
  type: "moment";
  category: string;
  promptName: string;
  moodValue: number | null;
};

export type WrapUpCardMetadata = {
  type: "wrap_up";
  periodType: WrapUpPeriod;
  periodStart: string;
  stats: WrapUpStats;
};

export type CardMetadata = MomentCardMetadata | WrapUpCardMetadata;

export function renderCardCanvas(metadata: CardMetadata, size = 1080) {
  if (typeof document === "undefined") return null;
  const baseSize = 1080;

  const baseCanvas = document.createElement("canvas");
  baseCanvas.width = baseSize;
  baseCanvas.height = baseSize;
  const baseCtx = baseCanvas.getContext("2d");
  if (!baseCtx) return null;

  if (metadata.type === "moment") {
    drawMomentCard(baseCtx, baseSize, metadata);
  } else {
    drawWrapUpCard(baseCtx, baseSize, metadata);
  }

  if (size === baseSize) return baseCanvas;

  const scaledCanvas = document.createElement("canvas");
  scaledCanvas.width = size;
  scaledCanvas.height = size;
  const scaledCtx = scaledCanvas.getContext("2d");
  if (!scaledCtx) return null;
  scaledCtx.drawImage(baseCanvas, 0, 0, size, size);
  return scaledCanvas;
}

export async function renderCardBlob(metadata: CardMetadata, size = 1080) {
  const canvas = renderCardCanvas(metadata, size);
  if (!canvas) return null;
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
}

export function fallbackCardText(metadata: CardMetadata) {
  if (metadata.type === "moment") {
    return {
      title: "I took a tiny pause today.",
      subtitle: metadata.promptName,
      detail: metadata.category,
    };
  }
  return {
    title:
      metadata.periodType === "weekly"
        ? "My week in tiny pauses"
        : metadata.periodType === "monthly"
          ? "My tiny pauses"
          : "A year of tiny pauses",
    subtitle: `${metadata.stats.total_moments} ${
      metadata.stats.total_moments === 1 ? "moment" : "moments"
    }`,
    detail: metadata.stats.mood_descriptor ?? "Tiny progress, one moment at a time.",
  };
}

function drawMomentCard(
  ctx: CanvasRenderingContext2D,
  size: number,
  metadata: MomentCardMetadata,
) {
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, "#ffedd8");
  gradient.addColorStop(1, "#ffe3c1");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "rgba(255,255,255,0.34)";
  drawRoundedRect(ctx, 86, 86, size - 172, size - 172, 48);
  ctx.fill();

  const badgeLabel = metadata.category || "Mindful moment";
  const badgeColor = badgeColorForCategory(metadata.category);
  ctx.font = "500 42px Inter, Avenir Next, Segoe UI, sans-serif";
  const badgeWidth = Math.max(260, ctx.measureText(badgeLabel).width + 90);
  const badgeX = (size - badgeWidth) / 2;
  const badgeY = 170;
  ctx.fillStyle = badgeColor;
  drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, 78, 39);
  ctx.fill();

  ctx.fillStyle = "#121826";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeLabel, size / 2, badgeY + 40);

  drawSprout(ctx, size / 2, 520, "#2f7e58");

  ctx.fillStyle = "#1b2438";
  ctx.font = "600 58px Inter, Avenir Next, Segoe UI, sans-serif";
  ctx.fillText("I took a tiny pause today.", size / 2, 700);

  ctx.fillStyle = "rgba(27, 36, 56, 0.82)";
  ctx.font = "500 38px Inter, Avenir Next, Segoe UI, sans-serif";
  ctx.fillText(metadata.promptName || "Tiny pause", size / 2, 768);

  ctx.fillStyle = "rgba(27, 36, 56, 0.6)";
  ctx.font = "500 30px Inter, Avenir Next, Segoe UI, sans-serif";
  ctx.fillText("tinypause.app", size / 2, 952);
}

function drawWrapUpCard(
  ctx: CanvasRenderingContext2D,
  size: number,
  metadata: WrapUpCardMetadata,
) {
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, "#ffe8cc");
  gradient.addColorStop(1, "#ffdcae");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "rgba(255,255,255,0.32)";
  drawRoundedRect(ctx, 72, 72, size - 144, size - 144, 44);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#1b2438";

  if (metadata.periodType === "weekly") {
    const start = new Date(`${metadata.periodStart}T00:00:00`);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    ctx.font = "600 58px Inter, Avenir Next, Segoe UI, sans-serif";
    ctx.fillText("My week in tiny pauses", size / 2, 152);

    drawLargeCount(ctx, size / 2, 245, metadata.stats.total_moments);
    drawCategoryBadge(ctx, size, metadata.stats.top_category ?? "Mindful moment");
    drawDayDotRow(ctx, size / 2, 520, metadata.stats.day_flags ?? []);

    ctx.fillStyle = "rgba(27,36,56,0.84)";
    ctx.font = "500 36px Inter, Avenir Next, Segoe UI, sans-serif";
    ctx.fillText(
      metadata.stats.closing_line ?? "A few quiet moments this week.",
      size / 2,
      650,
    );
    ctx.fillStyle = "rgba(27,36,56,0.65)";
    ctx.font = "500 26px Inter, Avenir Next, Segoe UI, sans-serif";
    ctx.fillText(
      `${start.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })}-${end.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`,
      size / 2,
      710,
    );
  } else if (metadata.periodType === "monthly") {
    const monthDate = new Date(`${metadata.periodStart}T00:00:00`);
    ctx.font = "600 64px Inter, Avenir Next, Segoe UI, sans-serif";
    ctx.fillText(
      monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
      size / 2,
      150,
    );
    ctx.font = "500 42px Inter, Avenir Next, Segoe UI, sans-serif";
    ctx.fillText("My tiny pauses", size / 2, 210);
    drawLargeCount(ctx, size / 2, 290, metadata.stats.total_moments);

    ctx.fillStyle = "rgba(27,36,56,0.78)";
    ctx.font = "500 30px Inter, Avenir Next, Segoe UI, sans-serif";
    const days = daysInMonth(monthDate.getFullYear(), monthDate.getMonth() + 1);
    ctx.fillText(
      `${metadata.stats.total_days_with_moments} of ${days} days`,
      size / 2,
      352,
    );
    drawCategoryBadge(ctx, size, metadata.stats.top_category ?? "Mindful moment");
    drawMonthGrid(ctx, size / 2, 570, metadata.stats.month_day_flags ?? []);
    ctx.fillStyle = "rgba(27,36,56,0.78)";
    ctx.font = "500 32px Inter, Avenir Next, Segoe UI, sans-serif";
    ctx.fillText(
      metadata.stats.mood_descriptor ?? "A mixed time. That's honest.",
      size / 2,
      772,
    );
  } else {
    const year = new Date(`${metadata.periodStart}T00:00:00`).getFullYear();
    ctx.font = "700 86px Inter, Avenir Next, Segoe UI, sans-serif";
    ctx.fillText(String(year), size / 2, 130);
    ctx.font = "500 44px Inter, Avenir Next, Segoe UI, sans-serif";
    ctx.fillText("A year of tiny pauses", size / 2, 195);
    drawLargeCount(ctx, size / 2, 280, metadata.stats.total_moments);

    ctx.fillStyle = "rgba(27,36,56,0.82)";
    ctx.font = "500 30px Inter, Avenir Next, Segoe UI, sans-serif";
    ctx.fillText(
      `${metadata.stats.total_days_with_moments} days with moments`,
      size / 2,
      340,
    );
    drawCategoryBadge(ctx, size, metadata.stats.top_category ?? "Mindful moment");
    ctx.fillText(
      `Best month: ${metadata.stats.best_month ?? "Unknown"}`,
      size / 2,
      430,
    );
    drawWeekDotRow(ctx, size / 2, 560, metadata.stats.week_flags ?? []);
    ctx.fillText(
      metadata.stats.mood_descriptor ?? "A pretty good run overall.",
      size / 2,
      760,
    );
  }

  ctx.fillStyle = "rgba(27, 36, 56, 0.6)";
  ctx.font = "500 30px Inter, Avenir Next, Segoe UI, sans-serif";
  ctx.fillText("tinypause.app", size / 2, 952);
}

function drawLargeCount(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  totalMoments: number,
) {
  ctx.fillStyle = "#f97316";
  ctx.font = "700 78px Inter, Avenir Next, Segoe UI, sans-serif";
  ctx.fillText(
    `${totalMoments} ${totalMoments === 1 ? "moment" : "moments"}`,
    x,
    y,
  );
}

function drawCategoryBadge(
  ctx: CanvasRenderingContext2D,
  size: number,
  category: string,
) {
  ctx.font = "500 34px Inter, Avenir Next, Segoe UI, sans-serif";
  const label = category || "Mindful moment";
  const width = Math.max(220, ctx.measureText(label).width + 76);
  const x = (size - width) / 2;
  const y = 390;
  ctx.fillStyle = badgeColorForCategory(label);
  drawRoundedRect(ctx, x, y, width, 62, 31);
  ctx.fill();
  ctx.fillStyle = "#121826";
  ctx.fillText(label, size / 2, y + 32);
}

function drawDayDotRow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  flags: boolean[],
) {
  const count = 7;
  const size = 38;
  const totalWidth = count * size;
  const startX = cx - totalWidth / 2;
  for (let i = 0; i < count; i++) {
    ctx.beginPath();
    ctx.arc(startX + i * size + size / 2, cy, flags[i] ? 10 : 7, 0, Math.PI * 2);
    ctx.fillStyle = flags[i] ? "rgba(37, 224, 197, 0.92)" : "rgba(163,171,179,0.26)";
    ctx.fill();
  }
}

function drawMonthGrid(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  flags: boolean[],
) {
  const columns = 7;
  const rows = Math.max(4, Math.ceil(Math.max(flags.length, 1) / columns));
  const dotGap = 30;
  const totalWidth = columns * dotGap;
  const totalHeight = rows * dotGap;
  const x0 = cx - totalWidth / 2;
  const y0 = cy - totalHeight / 2;
  for (let i = 0; i < rows * columns; i++) {
    const x = x0 + (i % columns) * dotGap + dotGap / 2;
    const y = y0 + Math.floor(i / columns) * dotGap + dotGap / 2;
    const active = flags[i] ?? false;
    ctx.beginPath();
    ctx.arc(x, y, active ? 7 : 5, 0, Math.PI * 2);
    ctx.fillStyle = active ? "rgba(37,224,197,0.9)" : "rgba(163,171,179,0.2)";
    ctx.fill();
  }
}

function drawWeekDotRow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  flags: boolean[],
) {
  const count = 52;
  const size = 16;
  const totalWidth = count * size;
  const x0 = cx - totalWidth / 2;
  for (let i = 0; i < count; i++) {
    ctx.beginPath();
    ctx.arc(x0 + i * size + size / 2, cy, flags[i] ? 4.8 : 3, 0, Math.PI * 2);
    ctx.fillStyle = flags[i] ? "rgba(37,224,197,0.9)" : "rgba(163,171,179,0.2)";
    ctx.fill();
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeWidth = Math.max(0, width);
  const safeHeight = Math.max(0, height);
  if (safeWidth === 0 || safeHeight === 0) return;
  const r = Math.max(0, Math.min(radius, safeWidth / 2, safeHeight / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + safeWidth, y, x + safeWidth, y + safeHeight, r);
  ctx.arcTo(x + safeWidth, y + safeHeight, x, y + safeHeight, r);
  ctx.arcTo(x, y + safeHeight, x, y, r);
  ctx.arcTo(x, y, x + safeWidth, y, r);
  ctx.closePath();
}

function drawSprout(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  color: string,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 14;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(centerX, centerY + 40);
  ctx.bezierCurveTo(centerX - 4, centerY - 18, centerX + 4, centerY - 62, centerX, centerY - 120);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(centerX - 46, centerY - 118, 56, 30, -0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(centerX + 46, centerY - 118, 56, 30, 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function badgeColorForCategory(category: string) {
  const lower = category.toLowerCase();
  if (lower.includes("letting")) return "#ff2f92";
  if (lower.includes("reflect")) return "#ffd84a";
  if (lower.includes("kind")) return "#9f7fff";
  if (lower.includes("pause")) return "#25e0c5";
  return "#9f7fff";
}

function daysInMonth(year: number, monthOneBased: number) {
  return new Date(year, monthOneBased, 0).getDate();
}
