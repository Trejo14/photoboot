import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const TARGET_LONG_SIDE = 1400;

const JOBS = [
  {
    srcDir:
      "C:/Users/Trejo/Downloads/2 fotos-20260906T181651Z-1-001/2 fotos",
    outSubdir: "strip-2-valentine",
    idPrefix: "strip-2-valentine",
    compatibleFormatId: "strip-2",
    photoCount: 2,
  },
  {
    srcDir:
      "C:/Users/Trejo/Downloads/Tira de 3-20260906T181716Z-1-001/Tira de 3",
    outSubdir: "strip-3-valentine",
    idPrefix: "strip-3-valentine",
    compatibleFormatId: "strip-3",
    photoCount: 3,
  },
  {
    srcDir:
      "C:/Users/Trejo/Downloads/Rectangulo 4-20260906T181637Z-1-001/Rectangulo 4",
    outSubdir: "grid-4-photobooth",
    idPrefix: "grid-4-photobooth",
    compatibleFormatId: "grid-4",
    photoCount: 4,
  },
];

const PUBLIC_FRAMES_DIR = path.resolve("public/frames");

function naturalNumber(fileName) {
  const m = fileName.match(/(\d+)\.\w+$/);
  return m ? parseInt(m[1], 10) : 0;
}

async function detectBoxes(data, width, height, channels, minArea) {
  const isWhite = (x, y) => {
    const i = (y * width + x) * channels;
    return data[i] > 248 && data[i + 1] > 248 && data[i + 2] > 248;
  };
  const stride = 4;
  const visited = new Uint8Array(width * height);
  const boxes = [];

  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const idx = y * width + x;
      if (visited[idx]) continue;
      if (!isWhite(x, y)) {
        visited[idx] = 1;
        continue;
      }
      let minX = x, maxX = x, minY = y, maxY = y;
      const stack = [[x, y]];
      visited[idx] = 1;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        const neighbors = [
          [cx + stride, cy],
          [cx - stride, cy],
          [cx, cy + stride],
          [cx, cy - stride],
        ];
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const nIdx = ny * width + nx;
          if (visited[nIdx]) continue;
          visited[nIdx] = 1;
          if (isWhite(nx, ny)) stack.push([nx, ny]);
        }
      }
      const w = maxX - minX;
      const h = maxY - minY;
      if (w * h >= minArea) {
        boxes.push({ minX, minY, maxX, maxY, w, h });
      }
    }
  }
  return boxes;
}

function sortReadingOrder(boxes) {
  const sorted = [...boxes].sort((a, b) => a.minY - b.minY);
  const rows = [];
  const rowTol = Math.max(...boxes.map((b) => b.h)) * 0.5;
  for (const b of sorted) {
    let row = rows.find((r) => Math.abs(r.y - b.minY) < rowTol);
    if (!row) {
      row = { y: b.minY, items: [] };
      rows.push(row);
    }
    row.items.push(b);
  }
  rows.sort((a, b) => a.y - b.y);
  const result = [];
  for (const row of rows) {
    row.items.sort((a, b) => a.minX - b.minX);
    result.push(...row.items);
  }
  return result;
}

function computeQrSlot(boxes, width, height) {
  const maxRight = Math.max(...boxes.map((b) => b.maxX));
  const maxBottom = Math.max(...boxes.map((b) => b.maxY));
  const minTop = Math.min(...boxes.map((b) => b.minY));
  const minLeft = Math.min(...boxes.map((b) => b.minX));

  const margins = [
    { side: "right", size: width - maxRight },
    { side: "bottom", size: height - maxBottom },
    { side: "top", size: minTop },
    { side: "left", size: minLeft },
  ].sort((a, b) => b.size - a.size);

  const best = margins[0];
  const qrSize = Math.max(50, Math.min(best.size * 0.6, 220));

  if (best.side === "bottom") {
    return {
      x: Math.round((width - qrSize) / 2),
      y: Math.round(maxBottom + (height - maxBottom - qrSize) / 2),
      size: Math.round(qrSize),
    };
  }
  if (best.side === "right") {
    return {
      x: Math.round(maxRight + (width - maxRight - qrSize) / 2),
      y: Math.round(height - qrSize - (height - maxBottom) * 0.3),
      size: Math.round(qrSize),
    };
  }
  if (best.side === "top") {
    return {
      x: Math.round((width - qrSize) / 2),
      y: Math.round((minTop - qrSize) / 2),
      size: Math.round(qrSize),
    };
  }
  return {
    x: Math.round((minLeft - qrSize) / 2),
    y: Math.round(height - qrSize - (height - maxBottom) * 0.3),
    size: Math.round(qrSize),
  };
}

async function processJob(job) {
  const files = (await fs.readdir(job.srcDir)).filter((f) =>
    /\.(png)$/i.test(f),
  );
  files.sort((a, b) => naturalNumber(a) - naturalNumber(b));

  const outDir = path.join(PUBLIC_FRAMES_DIR, job.outSubdir);
  await fs.mkdir(outDir, { recursive: true });

  const templates = [];

  for (let idx = 0; idx < files.length; idx++) {
    const file = files[idx];
    const srcPath = path.join(job.srcDir, file);
    const img = sharp(srcPath);
    const { data, info } = await img
      .clone()
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    const minArea = info.width * info.height * 0.03;
    let boxes = await detectBoxes(
      data,
      info.width,
      info.height,
      info.channels,
      minArea,
    );
    boxes.sort((a, b) => b.w * b.h - a.w * a.h);
    boxes = boxes.slice(0, job.photoCount);
    if (boxes.length !== job.photoCount) {
      console.warn(
        `  [skip] ${file}: found ${boxes.length} boxes, expected ${job.photoCount}`,
      );
      continue;
    }
    boxes = sortReadingOrder(boxes);

    const qrFull = computeQrSlot(boxes, info.width, info.height);

    const scale = TARGET_LONG_SIDE / Math.max(info.width, info.height);
    const newW = Math.round(info.width * scale);
    const newH = Math.round(info.height * scale);

    const resized = await sharp(srcPath)
      .resize(newW, newH)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const rBuf = resized.data;
    const rW = resized.info.width;
    const rH = resized.info.height;
    const rCh = resized.info.channels;

    const scaledBoxes = boxes.map((b) => ({
      x: Math.round(b.minX * scale),
      y: Math.round(b.minY * scale),
      width: Math.round(b.w * scale),
      height: Math.round(b.h * scale),
    }));

    for (const b of scaledBoxes) {
      const x0 = Math.max(0, b.x);
      const y0 = Math.max(0, b.y);
      const x1 = Math.min(rW, b.x + b.width);
      const y1 = Math.min(rH, b.y + b.height);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * rW + x) * rCh;
          rBuf[i + 3] = 0;
        }
      }
    }

    const outName = `${idx + 1}.png`;
    const outPath = path.join(outDir, outName);
    await sharp(rBuf, { raw: { width: rW, height: rH, channels: rCh } })
      .png({ compressionLevel: 9 })
      .toFile(outPath);

    const qrSlot = {
      x: Math.round(qrFull.x * scale),
      y: Math.round(qrFull.y * scale),
      size: Math.round(qrFull.size * scale),
    };

    templates.push({
      id: `${job.idPrefix}-${idx + 1}`,
      name: `Diseño ${idx + 1}`,
      compatibleFormatId: job.compatibleFormatId,
      backgroundImageUrl: `/frames/${job.outSubdir}/${outName}`,
      photoSlots: scaledBoxes,
      qrSlot,
      canvasSize: { width: rW, height: rH },
    });

    console.log(`  [ok] ${file} -> ${outPath}`);
  }

  return templates;
}

async function main() {
  const all = [];
  for (const job of JOBS) {
    console.log(`Processing ${job.srcDir}`);
    const templates = await processJob(job);
    all.push(...templates);
  }

  const header = `// Generated by scripts/process-frames.mjs — do not edit by hand.
// Re-run \`node scripts/process-frames.mjs\` after adding/replacing source
// designs in the JOBS list at the top of that script.
import type { FrameTemplate } from "./frame-templates";

export const GENERATED_FRAME_TEMPLATES: FrameTemplate[] = `;
  const body = JSON.stringify(all, null, 2) + ";\n";
  await fs.writeFile(
    path.resolve("src/lib/frame-templates.generated.ts"),
    header + body,
  );
  console.log(`\nGenerated ${all.length} templates.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
