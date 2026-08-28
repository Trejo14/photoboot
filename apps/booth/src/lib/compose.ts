import QRCode from "qrcode";
import { env } from "./env";
import type { FrameTemplate } from "./frame-templates";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar: ${src}`));
    img.src = src;
  });
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  return loadImage(url).finally(() => {
    setTimeout(() => URL.revokeObjectURL(url), 100);
  });
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const slotRatio = width / height;

  let sx: number, sy: number, sw: number, sh: number;

  if (imgRatio > slotRatio) {
    sh = img.naturalHeight;
    sw = sh * slotRatio;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    sw = img.naturalWidth;
    sh = sw / slotRatio;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
}

export interface ComposeResult {
  imageUrl: string;
  blob: Blob;
}

export async function composeFrame(
  frames: Blob[],
  template: FrameTemplate,
  photoId: string
): Promise<ComposeResult> {
  const { canvasSize, photoSlots, qrSlot, backgroundImageUrl } = template;

  const canvas = document.createElement("canvas");
  canvas.width = canvasSize.width;
  canvas.height = canvasSize.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el canvas");

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

  const photoImages = await Promise.all(frames.map(blobToImage));

  for (let i = 0; i < photoSlots.length && i < photoImages.length; i++) {
    const slot = photoSlots[i];
    const img = photoImages[i];
    if (slot && img) {
      drawImageCover(ctx, img, slot.x, slot.y, slot.width, slot.height);
    }
  }

  try {
    const frameImg = await loadImage(backgroundImageUrl);
    ctx.drawImage(frameImg, 0, 0, canvasSize.width, canvasSize.height);
  } catch {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    for (const slot of photoSlots) {
      if (slot) ctx.strokeRect(slot.x - 2, slot.y - 2, slot.width + 4, slot.height + 4);
    }
  }

  try {
    const galleryUrl = `${env.GALLERY_URL}/p/${photoId}`;
    const qrDataUrl = await QRCode.toDataURL(galleryUrl, {
      width: qrSlot.size,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });

    const qrImg = await loadImage(qrDataUrl);
    ctx.drawImage(qrImg, qrSlot.x, qrSlot.y, qrSlot.size, qrSlot.size);
  } catch {
    // QR generation failed - draw a placeholder
    ctx.fillStyle = "#fff";
    ctx.fillRect(qrSlot.x, qrSlot.y, qrSlot.size, qrSlot.size);
    ctx.fillStyle = "#000";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("QR", qrSlot.x + qrSlot.size / 2, qrSlot.y + qrSlot.size / 2 + 4);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo generar la imagen compuesta"));
          return;
        }
        const imageUrl = URL.createObjectURL(blob);
        resolve({ imageUrl, blob });
      },
      "image/jpeg",
      0.95
    );
  });
}
