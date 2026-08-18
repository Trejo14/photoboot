"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@photobooth/ui";
import { captureFrame, startCamera, type CameraHandle } from "@/lib/camera";

interface Props {
  onCapture: (blob: Blob) => void;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function CaptureScreen({ onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<CameraHandle | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!videoRef.current) return;
      try {
        const handle = await startCamera(videoRef.current);
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

  const handleCapture = useCallback(async () => {
    if (!videoRef.current || countdown !== null) return;

    setCountdown(3);
    await delay(1000);
    setCountdown(2);
    await delay(1000);
    setCountdown(1);
    await delay(1000);

    try {
      const blob = await captureFrame(videoRef.current);
      onCapture(blob);
    } catch {
      setError("No se pudo capturar la foto");
    } finally {
      setCountdown(null);
    }
  }, [countdown, onCapture]);

  return (
    <div className="relative flex h-dvh flex-col items-center justify-center overflow-hidden bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        className="h-full w-full -scale-x-100 object-cover"
      />
      {error ? (
        <p className="absolute top-4 rounded-md bg-red-500/90 px-4 py-2 text-sm text-white">
          {error}
        </p>
      ) : null}

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
            onClick={handleCapture}
            disabled={!!error || countdown !== null}
            className="h-16 rounded-full px-10 text-lg"
            size="lg"
          >
            Capturar
          </Button>
        </div>
      )}
    </div>
  );
}