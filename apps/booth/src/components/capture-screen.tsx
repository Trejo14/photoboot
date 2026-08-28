import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@photobooth/ui";
import { captureFrame, startCamera, type CameraHandle } from "@/lib/camera";
import { getSettings } from "@/lib/settings";
import type { PhotoFormat } from "@/lib/formats";

interface Props {
  format: PhotoFormat | undefined;
  onCapture: (blob: Blob) => void;
  onAllCaptured: (frames: Blob[]) => void;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function CaptureScreen({ format, onCapture, onAllCaptured }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<CameraHandle | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [showFlash, setShowFlash] = useState(false);
  const totalPhotos = format?.photoCount ?? 1;
  const loopRunningRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!videoRef.current) return;
      try {
        const settings = await getSettings();
        const handle = await startCamera(
          videoRef.current,
          settings.cameraDeviceId ?? undefined
        );
        if (cancelled) {
          handle.stop();
          return;
        }
        cameraRef.current = handle;
      } catch {
        if (!cancelled) {
          setError("No se pudo acceder a la cámara");
        }
      }
    })();
    return () => {
      cancelled = true;
      cameraRef.current?.stop();
      cameraRef.current = null;
    };
  }, []);

  const runCaptureLoop = useCallback(async () => {
    if (loopRunningRef.current || !videoRef.current) return;
    loopRunningRef.current = true;
    setCapturing(true);
    const frames: Blob[] = [];

    try {
      for (let i = 0; i < totalPhotos; i++) {
        setPhotoCount(i + 1);

        for (let c = 3; c >= 1; c--) {
          setCountdown(c);
          await delay(1000);
        }
        setCountdown(null);

        const blob = await captureFrame(videoRef.current);
        frames.push(blob);
        onCapture(blob);

        setShowFlash(true);
        await delay(300);
        setShowFlash(false);

        if (i < totalPhotos - 1) {
          await delay(500);
        }
      }

      onAllCaptured(frames);
    } catch {
      setError("No se pudo capturar la foto");
    } finally {
      setCapturing(false);
      setCountdown(null);
      loopRunningRef.current = false;
    }
  }, [totalPhotos, onCapture, onAllCaptured]);

  return (
    <div className="relative flex h-dvh flex-col items-center justify-center overflow-hidden bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        className="h-full w-full -scale-x-100 object-cover"
      />

      {showFlash && (
        <div className="absolute inset-0 bg-white animate-flash" />
      )}

      {error ? (
        <p className="absolute top-4 rounded-md bg-red-500/90 px-4 py-2 text-sm text-white">
          {error}
        </p>
      ) : null}

      {totalPhotos > 1 && !countdown && !capturing && (
        <div className="absolute top-4 left-4 rounded-md bg-black/60 px-3 py-1 text-sm text-white">
          Foto {photoCount} de {totalPhotos}
        </div>
      )}

      {countdown !== null ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <span
            className="countdown-number text-[10rem] font-black text-white"
            key={countdown}
          >
            {countdown}
          </span>
        </div>
      ) : (
        <div className="absolute bottom-24">
          <Button
            onClick={runCaptureLoop}
            disabled={!!error || capturing}
            className="h-16 rounded-full px-10 text-lg"
            size="lg"
          >
            {capturing
              ? `Capturando ${photoCount}/${totalPhotos}...`
              : "Capturar"}
          </Button>
        </div>
      )}
    </div>
  );
}
