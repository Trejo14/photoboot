export interface CameraHandle {
  stream: MediaStream;
  stop: () => void;
}

export async function startCamera(
  videoEl: HTMLVideoElement
): Promise<CameraHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  });

  videoEl.srcObject = stream;
  await videoEl.play();

  return {
    stream,
    stop: () => {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    },
  };
}

export async function captureFrame(
  videoEl: HTMLVideoElement,
  quality = 0.92
): Promise<Blob> {
  const width = videoEl.videoWidth || 1280;
  const height = videoEl.videoHeight || 720;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo crear el contexto 2D");
  }

  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(videoEl, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob falló"))),
      "image/jpeg",
      quality
    );
  });

  return blob;
}