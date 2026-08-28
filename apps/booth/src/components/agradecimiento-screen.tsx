import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { env } from "@/lib/env";

interface Props {
  photoId: string | null;
  onTimeout: () => void;
  durationMs?: number;
}

export function AgradecimientoScreen({
  photoId,
  onTimeout,
  durationMs = 10000,
}: Props) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (!photoId) return;
    const url = `${env.GALLERY_URL}/p/${photoId}`;
    void QRCode.toDataURL(url, { width: 300, margin: 1 })
      .then(setQrUrl)
      .catch(() => setQrUrl(null));
  }, [photoId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onTimeoutRef.current();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">¡Listo!</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Recógela en la impresora
        </p>
      </div>

      {qrUrl ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-lg">
          <img src={qrUrl} alt="QR de descarga" className="h-64 w-64" />
          <p className="text-sm text-black/60">Escanea para descargar tu foto</p>
        </div>
      ) : photoId ? (
        <div className="flex flex-col items-center gap-2">
          <div className="h-16 w-16 rounded-full border-4 border-white/10 border-t-[#22d3ee] animate-spin" />
          <p className="text-sm text-muted-foreground">Generando QR...</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Tu foto se sincronizará cuando haya conexión.
        </p>
      )}

      <p className="text-xs text-muted-foreground/60">
        Volviendo al inicio en unos segundos...
      </p>
    </div>
  );
}
