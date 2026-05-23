export type CardTheme =
  | "pause"
  | "letting-go"
  | "reflect"
  | "kindness"
  | "default";

// Map a moment's category label (and optional special key) to a theme.
export function resolveCardTheme(
  category?: string | null,
  specialKey?: string | null,
): CardTheme {
  const key = (specialKey ?? "").trim().toLowerCase();
  if (key === "letting-go") return "letting-go";
  if (key === "reflect") return "reflect";
  if (key === "kindness") return "kindness";

  const label = (category ?? "").trim().toLowerCase();
  if (label.includes("letting")) return "letting-go";
  if (label.includes("reflect")) return "reflect";
  if (label.includes("kind")) return "kindness";
  if (label.includes("pause")) return "pause";
  return "default";
}

// Draws a theme illustration centered at (centerX, centerY) on a 1080-ish card.
// Intentionally self-contained (only ctx + numbers + Math + Path2D) so it can be
// serialized via Function.toString() and rehydrated inside the headless
// social-card generator, keeping the in-app and Instagram cards identical.
export function drawCardIllustration(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  theme: string,
) {
  if (
    theme !== "letting-go" &&
    theme !== "reflect" &&
    theme !== "kindness" &&
    theme !== "pause"
  ) {
    // Default: the sprout (shifted so its visual mass is centered on cy).
    ctx.save();
    ctx.translate(0, 54);
    ctx.strokeStyle = "#2f7e58";
    ctx.fillStyle = "#2f7e58";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 40);
    ctx.bezierCurveTo(
      centerX - 4,
      centerY - 18,
      centerX + 4,
      centerY - 62,
      centerX,
      centerY - 120,
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(centerX - 46, centerY - 118, 56, 30, -0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 46, centerY - 118, 56, 30, 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Themed illustrations drawn in a 64x64 space, scaled up and centered.
  const scale = 2.6;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  ctx.translate(-32, -32);

  if (theme === "letting-go") {
    ctx.fillStyle = "#7edfaa";
    ctx.beginPath();
    ctx.ellipse(32, 22, 13, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3aa66f";
    ctx.fill(new Path2D("M29 36h6l-3 4z"));
    ctx.strokeStyle = "#3aa66f";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke(new Path2D("M32 40c0 4 2.5 5 2.5 8.5S32 53 32 56"));
  } else if (theme === "reflect") {
    ctx.fillStyle = "#f0c419";
    ctx.fill(new Path2D("M38 12a22 22 0 1 0 14 38A18 18 0 0 1 38 12z"));
    ctx.fillStyle = "#e0a800";
    ctx.fill(new Path2D("M47 13l1.6 4 4 1.6-4 1.6L47 26l-1.6-3.8-4-1.6 4-1.6z"));
  } else if (theme === "kindness") {
    ctx.fillStyle = "#f97316";
    ctx.fill(
      new Path2D(
        "M32 51S11 39 11 24.5C11 17 16.5 13 22 13c4 0 7.5 2.2 10 6 2.5-3.8 6-6 10-6 5.5 0 11 4 11 11.5C53 39 32 51 32 51z",
      ),
    );
  } else {
    // pause: concentric ripples
    ctx.fillStyle = "#66cccc";
    ctx.beginPath();
    ctx.arc(32, 32, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#66cccc";
    ctx.lineCap = "round";
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(32, 32, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(32, 32, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
