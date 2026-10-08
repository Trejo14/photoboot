import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@photobooth/ui";
import { env } from "@/lib/env";
import { printImage } from "@/lib/print";
import { errorMessage } from "@/lib/errors";

interface Props {
  photoId: string | null;
  blob: Blob;
  onDone: () => void;
}

export function DeliveryScreen({ photoId, blob, onDone }: Props) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!photoId) return;
    const url = `${env.GALLERY_URL}/photos/${photoId}`;
    void QRCode.toDataURL(url, { width: 256, margin: 1 })
      .then(setQrUrl)
      .catch(() => setQrUrl(null));
  }, [photoId]);

  async function handlePrint() {
    if (printing) return;
    setPrinting(true);
    setPrintStatus("Enviando a impresora…");
    try {
      const mode = await printImage(blob);
      setPrintStatus(
        mode === "thermal"
          ? "Impreso en impresora térmica"
          : "Abriendo el diálogo de impresión"
      );
    } catch (err) {
      setPrintStatus(errorMessage(err, "Error al imprimir"));
    } finally {
      setPrinting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-4">
      <h2 className="text-2xl font-bold">¡Listo!</h2>
      {qrUrl ? (
        <div className="flex flex-col items-center gap-2 rounded-lg bg-white p-4">
          <img src={qrUrl} alt="QR de descarga" className="h-56 w-56" />
          <p className="text-xs text-black">Escanea para descargar tu foto</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {photoId
            ? "Generando QR…"
            : "La foto se sincronizará cuando haya conexión."}
        </p>
      )}
      <div className="flex gap-4">
        <Button
          variant="secondary"
          size="lg"
          onClick={handlePrint}
          disabled={printing}
        >
          {printing ? "Imprimiendo…" : "Imprimir"}
        </Button>
        <Button size="lg" onClick={onDone}>
          Nueva foto
        </Button>
      </div>
      {printStatus ? (
        <p className="text-sm text-muted-foreground">{printStatus}</p>
      ) : null}
    </div>
  );
}