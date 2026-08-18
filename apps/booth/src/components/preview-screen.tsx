"use client";

import { Button } from "@photobooth/ui";

interface Props {
  imageUrl: string;
  onSave: () => void;
  onRetake: () => void;
}

export function PreviewScreen({ imageUrl, onSave, onRetake }: Props) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-4">
      <h2 className="text-2xl font-bold">¿Listo?</h2>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Vista previa"
        className="max-h-[60dvh] w-auto rounded-lg object-contain"
      />
      <div className="flex gap-4">
        <Button variant="secondary" size="lg" onClick={onRetake}>
          Reintentar
        </Button>
        <Button size="lg" onClick={onSave}>
          Guardar foto
        </Button>
      </div>
    </div>
  );
}