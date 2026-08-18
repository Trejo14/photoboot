"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@photobooth/ui";
import type { PhotoSummary } from "@photobooth/types";

export function PhotoViewer({ photo }: { photo: PhotoSummary }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(photo.originalUrl, { mode: "cors" });
      if (!res.ok) throw new Error("No se pudo descargar la foto");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `photobooth-${photo.id}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Ocurrió un error al descargar la foto.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-4 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Tu foto</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.originalUrl}
            alt="Foto del evento"
            className="w-full rounded-lg object-contain"
          />
          <div className="flex w-full gap-3">
            <Button className="flex-1" onClick={handleDownload} disabled={downloading}>
              {downloading ? "Descargando…" : "Descargar"}
            </Button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    </main>
  );
}