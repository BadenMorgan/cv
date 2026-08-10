/**
 * Optional offline bake of sensitive text blocks to PNG.
 * Requires: npm i && npm run generate:text-images
 * Runtime already falls back to canvas → CSS background-image if PNGs are missing.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "assets", "text-images");
const dataPath = path.join(root, "assets", "data", "resume.json");

const require = createRequire(import.meta.url);

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function paint(block, { width = 640, fontSize = 14 } = {}) {
  const { createCanvas } = require("@napi-rs/canvas");
  const lineHeight = fontSize * 1.45;
  const padding = 2;
  const bulletIndent = 18;
  const canvasProbe = createCanvas(width, 10);
  const ctxProbe = canvasProbe.getContext("2d");
  ctxProbe.font = `${fontSize}px "Times New Roman"`;

  const allLines = [];
  if (block.kind === "paragraphs") {
    for (const para of block.paragraphs) {
      allLines.push(...wrapText(ctxProbe, para, width - padding * 2).map((t) => ({ t, bullet: false })));
      allLines.push({ t: "", bullet: false });
    }
  } else {
    for (const item of block.items) {
      wrapText(ctxProbe, item, width - padding * 2 - bulletIndent).forEach((t, i) => {
        allLines.push({ t, bullet: i === 0 });
      });
      allLines.push({ t: "", bullet: false });
    }
  }
  while (allLines.length && allLines[allLines.length - 1].t === "") allLines.pop();

  let height = padding * 2;
  for (const row of allLines) {
    height += row.t === "" && !row.bullet ? lineHeight * 0.35 : lineHeight;
  }

  const canvas = createCanvas(width, Math.ceil(height));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#222222";
  ctx.font = `${fontSize}px "Times New Roman"`;
  ctx.textBaseline = "top";

  let y = padding;
  for (const row of allLines) {
    if (row.t === "" && !row.bullet) {
      y += lineHeight * 0.35;
      continue;
    }
    const x = block.kind === "bullets" ? padding + bulletIndent : padding;
    if (row.bullet) {
      ctx.beginPath();
      ctx.arc(padding + 6, y + fontSize * 0.45, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillText(row.t, x, y);
    y += lineHeight;
  }

  return canvas.toBuffer("image/png");
}

async function main() {
  let canvasOk = false;
  try {
    require.resolve("@napi-rs/canvas");
    canvasOk = true;
  } catch {
    console.error(
      "Missing @napi-rs/canvas. Run: npm install\n" +
        "Site still works without PNGs (browser canvas fallback)."
    );
    process.exitCode = 1;
    return;
  }

  if (!canvasOk) return;

  fs.mkdirSync(outDir, { recursive: true });
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  for (const [id, block] of Object.entries(data.textBlocks)) {
    const fontSize = block.kind === "paragraphs" ? 13 : 12.5;
    const buf = paint(block, { width: 640, fontSize });
    const file = path.join(outDir, `${id}.png`);
    fs.writeFileSync(file, buf);
    console.log("wrote", path.relative(root, file));
  }
}

main();
