function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      reject(new Error("No se pudo cargar la imagen para la marca de agua"));
    };
    img.src = url;
  }).finally(() => {
    setTimeout(() => URL.revokeObjectURL(url), 100);
  });
}

/**
 * Stamps a "trial version" badge on the free-plan output so a Free-tier
 * photo is never mistaken for the unwatermarked Pro/Lifetime result.
 */
export async function applyTrialWatermark(blob: Blob): Promise<Blob> {
  const img = await blobToImage(blob);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return blob;

  ctx.drawImage(img, 0, 0);

  const text = "BIRDCAM · VERSIÓN DE PRUEBA";
  const fontSize = Math.max(14, Math.round(canvas.width * 0.032));
  ctx.font = `700 ${fontSize}px sans-serif`;
  const padX = fontSize * 0.9;
  const padY = fontSize * 0.6;
  const textWidth = ctx.measureText(text).width;
  const boxW = textWidth + padX * 2;
  const boxH = fontSize + padY * 2;
  const margin = canvas.width * 0.03;
  const x = (canvas.width - boxW) / 2;
  const y = canvas.height - boxH - margin;
  const r = boxH / 2;

  ctx.fillStyle = "rgba(10, 10, 15, 0.6)";
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + boxW, y, x + boxW, y + boxH, r);
  ctx.arcTo(x + boxW, y + boxH, x, y + boxH, r);
  ctx.arcTo(x, y + boxH, x, y, r);
  ctx.arcTo(x, y, x + boxW, y, r);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, y + boxH / 2 + fontSize * 0.05);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) =>
        b
          ? resolve(b)
          : reject(new Error("No se pudo generar la marca de agua")),
      "image/jpeg",
      0.95,
    );
  });
}
