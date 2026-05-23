export type CardTheme =
  | "pause"
  | "letting-go"
  | "reflect"
  | "kindness"
  | "pencil"
  | "ghost"
  | "leaf"
  | "star"
  | "heart"
  | "sun"
  | "moon"
  | "sunrise"
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
  const isThemed =
    theme === "letting-go" ||
    theme === "reflect" ||
    theme === "kindness" ||
    theme === "pause" ||
    theme === "pencil" ||
    theme === "ghost" ||
    theme === "leaf" ||
    theme === "star" ||
    theme === "heart" ||
    theme === "sun" ||
    theme === "moon" ||
    theme === "sunrise";

  if (!isThemed) {
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
  } else if (theme === "pencil") {
    // back-to-school: a pencil on the diagonal
    ctx.save();
    ctx.translate(32, 32);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = "#f4c447";
    ctx.fillRect(-6, -2, 12, 20);
    ctx.fillStyle = "#e0a800";
    ctx.fillRect(-6, 18, 12, 4);
    ctx.fillStyle = "#ef9a9a";
    ctx.fillRect(-6, 22, 12, 6);
    ctx.fillStyle = "#e8b06a";
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(6, -2);
    ctx.lineTo(0, -16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#3a3a3a";
    ctx.beginPath();
    ctx.moveTo(-2.4, -11);
    ctx.lineTo(2.4, -11);
    ctx.lineTo(0, -16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (theme === "ghost") {
    // halloween: a friendly ghost
    ctx.fillStyle = "#b9a7e6";
    ctx.beginPath();
    ctx.arc(32, 28, 15, Math.PI, 0);
    ctx.lineTo(47, 46);
    ctx.quadraticCurveTo(42.5, 40, 38, 46);
    ctx.quadraticCurveTo(33.5, 52, 29, 46);
    ctx.quadraticCurveTo(24.5, 40, 20, 46);
    ctx.lineTo(17, 46);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#3a2f5a";
    ctx.beginPath();
    ctx.arc(27, 27, 2.6, 0, Math.PI * 2);
    ctx.arc(37, 27, 2.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (theme === "leaf") {
    // thanksgiving: a single autumn leaf
    ctx.save();
    ctx.translate(32, 32);
    ctx.rotate(-0.4);
    ctx.fillStyle = "#e08a3c";
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#a85e22";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(0, 20);
    ctx.moveTo(0, -6);
    ctx.lineTo(7, -12);
    ctx.moveTo(0, -6);
    ctx.lineTo(-7, -12);
    ctx.moveTo(0, 4);
    ctx.lineTo(8, -1);
    ctx.moveTo(0, 4);
    ctx.lineTo(-8, -1);
    ctx.stroke();
    ctx.restore();
  } else if (theme === "star") {
    // holiday: a five-point star
    ctx.fillStyle = "#f5c542";
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? 18 : 8;
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const x = 32 + Math.cos(angle) * radius;
      const y = 32 + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  } else if (theme === "heart") {
    // valentines: a heart
    ctx.fillStyle = "#ef5d8f";
    const hx = 32;
    const hy = 30;
    ctx.beginPath();
    ctx.moveTo(hx, hy + 16);
    ctx.bezierCurveTo(hx - 22, hy - 3, hx - 16, hy - 20, hx, hy - 8);
    ctx.bezierCurveTo(hx + 16, hy - 20, hx + 22, hy - 3, hx, hy + 16);
    ctx.closePath();
    ctx.fill();
  } else if (theme === "sun") {
    // end-of-school: a sun with rays
    ctx.fillStyle = "#f6b73c";
    ctx.beginPath();
    ctx.arc(32, 32, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f6b73c";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(32 + Math.cos(angle) * 16, 32 + Math.sin(angle) * 16);
      ctx.lineTo(32 + Math.cos(angle) * 22, 32 + Math.sin(angle) * 22);
      ctx.stroke();
    }
  } else if (theme === "moon") {
    // sunday evening: a crescent moon with two stars
    ctx.fillStyle = "#e9c84a";
    ctx.beginPath();
    ctx.arc(30, 30, 16, Math.PI * 0.35, Math.PI * 1.65, false);
    ctx.arc(36, 30, 13, Math.PI * 1.55, Math.PI * 0.45, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#cdb4f0";
    ctx.beginPath();
    ctx.arc(47, 19, 2, 0, Math.PI * 2);
    ctx.arc(45, 40, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (theme === "sunrise") {
    // monday morning: a sunrise over the horizon
    ctx.strokeStyle = "#e8b96a";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(12, 42);
    ctx.lineTo(52, 42);
    ctx.stroke();
    ctx.fillStyle = "#f6a63c";
    ctx.beginPath();
    ctx.arc(32, 42, 12, Math.PI, 0, false);
    ctx.fill();
    ctx.strokeStyle = "#f6a63c";
    ctx.lineWidth = 2.6;
    const rays = [
      -Math.PI * 0.85,
      -Math.PI * 0.65,
      -Math.PI * 0.5,
      -Math.PI * 0.35,
      -Math.PI * 0.15,
    ];
    for (const angle of rays) {
      ctx.beginPath();
      ctx.moveTo(32 + Math.cos(angle) * 15, 42 + Math.sin(angle) * 15);
      ctx.lineTo(32 + Math.cos(angle) * 21, 42 + Math.sin(angle) * 21);
      ctx.stroke();
    }
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
