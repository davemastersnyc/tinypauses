export type WrapUpPeriod = "weekly" | "monthly" | "yearly";

export type WrapUpStats = {
  total_moments: number;
  total_days_with_moments: number;
  brain_break_count?: number | null;
  top_category?: string | null;
  mood_average?: number | null;
  mood_descriptor?: string | null;
  best_month?: string | null;
  brain_break_day_name?: string | null;
  brain_break_year_note?: string | null;
  brain_break_month_counts?: number[] | null;
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
  specialType?: "seasonal" | "weekly" | null;
  specialKey?: string | null;
};

export type WrapUpCardMetadata = {
  type: "wrap_up";
  periodType: WrapUpPeriod;
  periodStart: string;
  stats: WrapUpStats;
};

export type CardMetadata = MomentCardMetadata | WrapUpCardMetadata;

let smileIconImage: HTMLImageElement | null = null;

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
  if (metadata.specialType === "seasonal") {
    gradient.addColorStop(0, "#ffe8d6");
    gradient.addColorStop(1, "#ffd7bb");
  } else if (metadata.specialType === "weekly") {
    gradient.addColorStop(0, "#66cccc");
    gradient.addColorStop(1, "#66cccc");
  } else {
    gradient.addColorStop(0, "#ffedd8");
    gradient.addColorStop(1, "#ffe3c1");
  }
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

  if (metadata.specialType && metadata.specialKey) {
    drawSpecialCornerIllustration(ctx, size - 170, 150, metadata.specialKey);
  }

  drawSprout(ctx, size / 2, 520, "#2f7e58");

  ctx.fillStyle = "#1b2438";
  ctx.font = "600 58px Inter, Avenir Next, Segoe UI, sans-serif";
  ctx.fillText("I took a tiny pause today.", size / 2, 700);

  ctx.fillStyle = "rgba(27, 36, 56, 0.82)";
  ctx.font = "500 38px Inter, Avenir Next, Segoe UI, sans-serif";
  ctx.fillText(metadata.promptName || "Tiny pause", size / 2, 768);

  drawMomentBrandIcon(ctx, size, 26);

  ctx.fillStyle = "rgba(27, 36, 56, 0.6)";
  ctx.font = "500 30px Inter, Avenir Next, Segoe UI, sans-serif";
  ctx.fillText("tinypauses.com", size / 2, 952);
}

function drawMomentBrandIcon(ctx: CanvasRenderingContext2D, size: number, iconSize: number) {
  const icon = ensureSmileIcon();
  const x = size / 2 - iconSize / 2;
  const y = 892;
  if (icon && icon.complete && icon.naturalWidth > 0) {
    ctx.drawImage(icon, x, y, iconSize, iconSize);
    return;
  }
  drawFallbackSmileIcon(ctx, size / 2, y + iconSize / 2, iconSize / 2);
}

function ensureSmileIcon() {
  if (typeof window === "undefined") return null;
  if (!smileIconImage) {
    smileIconImage = new Image();
    smileIconImage.decoding = "async";
    smileIconImage.src = "/brand/SmileCircle.png";
  }
  return smileIconImage;
}

function drawFallbackSmileIcon(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
) {
  ctx.save();
  ctx.fillStyle = "#ffd84a";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#1b2438";
  ctx.lineWidth = Math.max(1.8, radius * 0.11);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.32, centerY - radius * 0.2, radius * 0.08, 0, Math.PI * 2);
  ctx.arc(centerX + radius * 0.32, centerY - radius * 0.2, radius * 0.08, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX, centerY + radius * 0.06, radius * 0.42, 0.16 * Math.PI, 0.84 * Math.PI);
  ctx.stroke();
  ctx.restore();
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
    if ((metadata.stats.brain_break_count ?? 0) > 0) {
      ctx.fillStyle = "#66cccc";
      ctx.font = "500 30px Inter, Avenir Next, Segoe UI, sans-serif";
      const count = metadata.stats.brain_break_count ?? 0;
      ctx.fillText(
        `${count} brain break${count === 1 ? "" : "s"} taken.`,
        size / 2,
        304,
      );
    }
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
    const brainBreakCount = metadata.stats.brain_break_count ?? 0;
    if (brainBreakCount > 0) {
      ctx.fillStyle = "#66cccc";
      ctx.font = "600 28px Inter, Avenir Next, Segoe UI, sans-serif";
      ctx.fillText(
        `Brain breaks: ${brainBreakCount}`,
        size / 2,
        392,
      );
    }
    drawCategoryBadge(ctx, size, metadata.stats.top_category ?? "Mindful moment", 430);
    drawMonthGrid(ctx, size / 2, 590, metadata.stats.month_day_flags ?? []);
    if (metadata.stats.brain_break_day_name) {
      ctx.fillStyle = "rgba(31,111,134,0.86)";
      ctx.font = "500 26px Inter, Avenir Next, Segoe UI, sans-serif";
      ctx.fillText(
        `You often reached for a brain break on ${metadata.stats.brain_break_day_name}s.`,
        size / 2,
        750,
      );
    }
    ctx.fillStyle = "rgba(27,36,56,0.78)";
    ctx.font = "500 32px Inter, Avenir Next, Segoe UI, sans-serif";
    ctx.fillText(
      metadata.stats.mood_descriptor ?? "A mixed time. That's honest.",
      size / 2,
      metadata.stats.brain_break_day_name ? 800 : 772,
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
    drawYearBrainBreakCallout(
      ctx,
      size / 2,
      655,
      metadata.stats.brain_break_year_note ??
        `You slowed your brain down ${metadata.stats.brain_break_count ?? 0} ${
          (metadata.stats.brain_break_count ?? 0) === 1 ? "time" : "times"
        } this year.`,
    );
    drawBrainBreakMonthBars(
      ctx,
      size / 2,
      752,
      metadata.stats.brain_break_month_counts ?? [],
    );
    ctx.fillText(
      metadata.stats.mood_descriptor ?? "A pretty good run overall.",
      size / 2,
      820,
    );
  }

  ctx.fillStyle = "rgba(27, 36, 56, 0.6)";
  ctx.font = "500 30px Inter, Avenir Next, Segoe UI, sans-serif";
  ctx.fillText("tinypauses.com", size / 2, 952);
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
  y = 390,
) {
  ctx.font = "500 34px Inter, Avenir Next, Segoe UI, sans-serif";
  const label = category || "Mindful moment";
  const width = Math.max(220, ctx.measureText(label).width + 76);
  const x = (size - width) / 2;
  ctx.fillStyle = badgeColorForCategory(label);
  drawRoundedRect(ctx, x, y, width, 62, 31);
  ctx.fill();
  ctx.fillStyle = "#121826";
  ctx.fillText(label, size / 2, y + 32);
}

function drawYearBrainBreakCallout(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  text: string,
) {
  const width = 760;
  const height = 92;
  const x = cx - width / 2;
  const y = cy - height / 2;
  ctx.fillStyle = "rgba(92,174,195,0.17)";
  drawRoundedRect(ctx, x, y, width, height, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(92,174,195,0.45)";
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, x, y, width, height, 28);
  ctx.stroke();
  ctx.fillStyle = "#66cccc";
  ctx.font = "600 28px Inter, Avenir Next, Segoe UI, sans-serif";
  ctx.fillText(text, cx, cy + 1);
}

function drawBrainBreakMonthBars(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  counts: number[],
) {
  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const values = counts.slice(0, 12);
  while (values.length < 12) values.push(0);
  const max = Math.max(1, ...values);
  const gap = 20;
  const barWidth = 10;
  const chartWidth = months.length * gap;
  const x0 = cx - chartWidth / 2;
  const baseY = cy + 12;

  ctx.fillStyle = "rgba(31,111,134,0.72)";
  ctx.font = "500 20px Inter, Avenir Next, Segoe UI, sans-serif";
  ctx.fillText("Brain break months", cx, cy - 18);

  for (let i = 0; i < months.length; i++) {
    const h = Math.max(3, (values[i] / max) * 42);
    const x = x0 + i * gap + (gap - barWidth) / 2;
    const y = baseY - h;
    ctx.fillStyle = "rgba(92,174,195,0.95)";
    drawRoundedRect(ctx, x, y, barWidth, h, 4);
    ctx.fill();

    ctx.fillStyle = "rgba(27,36,56,0.55)";
    ctx.font = "500 12px Inter, Avenir Next, Segoe UI, sans-serif";
    ctx.fillText(months[i], x + barWidth / 2, baseY + 13);
  }
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
  const lower = category.trim().toLowerCase();
  if (lower.includes("letting")) return "#ff2f92";
  if (lower.includes("reflect")) return "#ffd84a";
  if (lower.includes("kind")) return "#66cccc";
  if (lower.includes("brain")) return "#66cccc";
  if (lower.includes("pause")) return "#66cccc";
  if (lower.includes("mindful")) return "#66cccc";
  return "#f97316";
}

function drawSpecialCornerIllustration(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  specialKey: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  drawRoundedRect(ctx, -52, -52, 104, 104, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(27,36,56,0.18)";
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, -52, -52, 104, 104, 28);
  ctx.stroke();

  ctx.strokeStyle = "#2a3141";
  ctx.fillStyle = "#2a3141";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  if (specialKey === "back-to-school") {
    ctx.beginPath();
    ctx.moveTo(-18, 18);
    ctx.lineTo(22, -22);
    ctx.stroke();
    ctx.fillStyle = "#f4c447";
    ctx.beginPath();
    ctx.moveTo(22, -22);
    ctx.lineTo(30, -30);
    ctx.lineTo(16, -28);
    ctx.closePath();
    ctx.fill();
  } else if (specialKey === "halloween") {
    ctx.beginPath();
    ctx.arc(0, 4, 22, Math.PI, 0);
    ctx.fillStyle = "#f3a35f";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-22, 4);
    ctx.quadraticCurveTo(-10, 34, 0, 16);
    ctx.quadraticCurveTo(10, 34, 22, 4);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-9, 0, 4, 0, Math.PI * 2);
    ctx.arc(9, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (specialKey === "thanksgiving-week") {
    ctx.fillStyle = "#cc8f3a";
    ctx.beginPath();
    ctx.ellipse(0, 5, 22, 14, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#83551f";
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.quadraticCurveTo(8, -24, 12, 8);
    ctx.stroke();
  } else if (specialKey === "holiday-season") {
    ctx.strokeStyle = "#2a3141";
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(0, 26);
    ctx.moveTo(-26, 0);
    ctx.lineTo(26, 0);
    ctx.moveTo(-18, -18);
    ctx.lineTo(18, 18);
    ctx.moveTo(18, -18);
    ctx.lineTo(-18, 18);
    ctx.stroke();
  } else if (specialKey === "valentines-day") {
    ctx.fillStyle = "#d878aa";
    ctx.beginPath();
    ctx.moveTo(0, 24);
    ctx.bezierCurveTo(-22, 5, -28, -8, -14, -18);
    ctx.bezierCurveTo(-5, -24, 0, -14, 0, -10);
    ctx.bezierCurveTo(0, -14, 5, -24, 14, -18);
    ctx.bezierCurveTo(28, -8, 22, 5, 0, 24);
    ctx.fill();
  } else {
    ctx.fillStyle = "#f1b84f";
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const x1 = Math.cos(angle) * 20;
      const y1 = Math.sin(angle) * 20;
      const x2 = Math.cos(angle) * 30;
      const y2 = Math.sin(angle) * 30;
      ctx.strokeStyle = "#f1b84f";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function daysInMonth(year: number, monthOneBased: number) {
  return new Date(year, monthOneBased, 0).getDate();
}
