import { isTauri } from "./tauri";
import type { FrameTemplate, PhotoSlot, QrSlot } from "./frame-templates";

export type FrameSource = "system" | "custom";

const TARGET_LONG_SIDE = 1400;

interface Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  w: number;
  h: number;
}

// Mismo algoritmo que scripts/process-frames.mjs (que genera los marcos del
// sistema en build-time con `sharp`), pero corriendo en el navegador sobre
// un <canvas> para que un marco subido por el operador se procese al
// momento, sin paso de build. La convención es la misma: el operador dibuja
// rectángulos BLANCOS SÓLIDOS en su imagen donde quiere que aparezcan las
// fotos — el sistema los detecta y los vuelve transparentes.
function detectBoxes(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  minArea: number,
): Box[] {
  const isWhite = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    return data[i]! > 248 && data[i + 1]! > 248 && data[i + 2]! > 248;
  };
  const stride = 4;
  const visited = new Uint8Array(width * height);
  const boxes: Box[] = [];

  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const idx = y * width + x;
      if (visited[idx]) continue;
      if (!isWhite(x, y)) {
        visited[idx] = 1;
        continue;
      }
      let minX = x,
        maxX = x,
        minY = y,
        maxY = y;
      const stack: [number, number][] = [[x, y]];
      visited[idx] = 1;
      while (stack.length) {
        const [cx, cy] = stack.pop()!;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        const neighbors: [number, number][] = [
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

function sortReadingOrder(boxes: Box[]): Box[] {
  const sorted = [...boxes].sort((a, b) => a.minY - b.minY);
  const rows: { y: number; items: Box[] }[] = [];
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
  const result: Box[] = [];
  for (const row of rows) {
    row.items.sort((a, b) => a.minX - b.minX);
    result.push(...row.items);
  }
  return result;
}

function computeQrSlot(boxes: Box[], width: number, height: number): QrSlot {
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

  const best = margins[0]!;
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

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

export class FrameDetectionError extends Error {}

/**
 * Procesa una imagen subida por el operador: detecta los rectángulos
 * blancos (huecos para las fotos), los vuelve transparentes, y arma un
 * FrameTemplate listo para usar en el compositor — igual que los marcos
 * del sistema, pero generado al vuelo en vez de en build-time.
 */
export async function processCustomFrameImage(
  file: File,
  opts: { name: string; compatibleFormatId: string; photoCount: number },
): Promise<{ template: FrameTemplate; pngDataUrl: string }> {
  const img = await loadImage(file);

  const scale = Math.min(1, TARGET_LONG_SIDE / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new FrameDetectionError("No se pudo procesar la imagen");
  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const minArea = width * height * 0.03;
  let boxes = detectBoxes(imageData.data, width, height, minArea);
  boxes.sort((a, b) => b.w * b.h - a.w * a.h);
  boxes = boxes.slice(0, opts.photoCount);

  if (boxes.length !== opts.photoCount) {
    throw new FrameDetectionError(
      `Se esperaban ${opts.photoCount} huecos para fotos (rectángulos blancos sólidos) y se detectaron ${boxes.length}. Revisa que cada hueco sea blanco puro y no se toque con otro.`,
    );
  }
  boxes = sortReadingOrder(boxes);

  const qrSlot = computeQrSlot(boxes, width, height);

  const photoSlots: PhotoSlot[] = boxes.map((b) => ({
    x: b.minX,
    y: b.minY,
    width: b.w,
    height: b.h,
  }));

  // Punch: vuelve transparente cada hueco detectado para que la foto
  // compuesta se vea a través del marco.
  for (const b of photoSlots) {
    const x0 = Math.max(0, b.x);
    const y0 = Math.max(0, b.y);
    const x1 = Math.min(width, b.x + b.width);
    const y1 = Math.min(height, b.y + b.height);
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * width + x) * 4;
        imageData.data[i + 3] = 0;
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);

  const pngDataUrl = canvas.toDataURL("image/png");
  const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const template: FrameTemplate = {
    id,
    name: opts.name,
    compatibleFormatId: opts.compatibleFormatId,
    backgroundImageUrl: pngDataUrl,
    photoSlots,
    qrSlot,
    canvasSize: { width, height },
  };

  return { template, pngDataUrl };
}

// ── Almacenamiento por operador ──
// Se guarda dentro del mismo store local que ya usa el resto de la app
// (tauri-apps/plugin-store), como una imagen embebida en base64 — así no
// hace falta pedir permisos nuevos de sistema de archivos. Tiene sentido
// para el volumen esperado (unos cuantos marcos por operador); si algún
// día se sube un catálogo grande de marcos, convendría pasar a guardar
// archivos sueltos en el directorio de datos de la app en vez de esto.

const UNKNOWN_USER_KEY = "__unknown__";

function customFramesStoreKey(email: string | null): string {
  return `customFrames:${email ?? UNKNOWN_USER_KEY}`;
}

function frameSourceStoreKey(email: string | null): string {
  return `frameSource:${email ?? UNKNOWN_USER_KEY}`;
}

async function getStore() {
  const { load } = await import("@tauri-apps/plugin-store");
  return load("settings.json");
}

export async function getCustomFrames(
  email: string | null,
): Promise<FrameTemplate[]> {
  if (!isTauri) {
    const raw = localStorage.getItem(customFramesStoreKey(email));
    return raw ? (JSON.parse(raw) as FrameTemplate[]) : [];
  }
  const store = await getStore();
  return (await store.get<FrameTemplate[]>(customFramesStoreKey(email))) ?? [];
}

export async function addCustomFrame(
  email: string | null,
  template: FrameTemplate,
): Promise<void> {
  const existing = await getCustomFrames(email);
  const next = [...existing, template];
  if (!isTauri) {
    localStorage.setItem(customFramesStoreKey(email), JSON.stringify(next));
    return;
  }
  const store = await getStore();
  await store.set(customFramesStoreKey(email), next);
  await store.save();
}

export async function deleteCustomFrame(
  email: string | null,
  frameId: string,
): Promise<void> {
  const existing = await getCustomFrames(email);
  const next = existing.filter((f) => f.id !== frameId);
  if (!isTauri) {
    localStorage.setItem(customFramesStoreKey(email), JSON.stringify(next));
    return;
  }
  const store = await getStore();
  await store.set(customFramesStoreKey(email), next);
  await store.save();
}

export async function getFrameSource(
  email: string | null,
): Promise<FrameSource> {
  if (!isTauri) {
    return (
      (localStorage.getItem(frameSourceStoreKey(email)) as FrameSource) ||
      "system"
    );
  }
  const store = await getStore();
  return (await store.get<FrameSource>(frameSourceStoreKey(email))) ?? "system";
}

export async function setFrameSource(
  email: string | null,
  source: FrameSource,
): Promise<void> {
  if (!isTauri) {
    localStorage.setItem(frameSourceStoreKey(email), source);
    return;
  }
  const store = await getStore();
  await store.set(frameSourceStoreKey(email), source);
  await store.save();
}
