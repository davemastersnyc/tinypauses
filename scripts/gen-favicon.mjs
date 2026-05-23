// One-off: regenerate the browser favicon from the clean circular smile mark
// (SmileCircle.png, transparent background) so it has no boxed background.
// Writes a multi-size favicon.ico (PNG-embedded) and a small SmileFavicon.png.
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const SRC = "public/brand/SmileCircle.png";

async function pngBuffer(size) {
  return sharp(SRC)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

// Wrap one or more PNG buffers into an ICO container.
function buildIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  const bodies = [];
  images.forEach((img, i) => {
    const b = 16 * i;
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, b + 0); // width (0 = 256)
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, b + 1); // height
    dir.writeUInt8(0, b + 2); // palette
    dir.writeUInt8(0, b + 3); // reserved
    dir.writeUInt16LE(1, b + 4); // color planes
    dir.writeUInt16LE(32, b + 6); // bits per pixel
    dir.writeUInt32LE(img.data.length, b + 8); // size of image data
    dir.writeUInt32LE(offset, b + 12); // offset
    offset += img.data.length;
    bodies.push(img.data);
  });

  return Buffer.concat([header, dir, ...bodies]);
}

const sizes = [16, 32, 48];
const images = [];
for (const size of sizes) {
  images.push({ size, data: await pngBuffer(size) });
}

writeFileSync("src/app/favicon.ico", buildIco(images));
writeFileSync("public/brand/SmileFavicon.png", await pngBuffer(64));

console.log("Wrote src/app/favicon.ico (16/32/48) and public/brand/SmileFavicon.png (64).");
