import { useEffect, useRef } from "react";

interface Props {
  imageUrl: string;
  onAutoPrint: () => void;
  durationMs?: number;
}

export function VistaFinalScreen({ imageUrl, onAutoPrint, durationMs = 4000 }: Props) {
  const onAutoPrintRef = useRef(onAutoPrint);
  onAutoPrintRef.current = onAutoPrint;

  useEffect(() => {
    const timer = setTimeout(() => {
      onAutoPrintRef.current();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-black p-4">
      <h2 className="text-2xl font-bold text-white">¡Foto lista!</h2>
      <img
        src={imageUrl}
        alt="Foto compuesta"
        className="max-h-[70dvh] w-auto rounded-lg object-contain shadow-2xl"
      />
      <p className="text-sm text-white/60 animate-pulse">
        Imprimiendo tu foto...
      </p>
    </div>
  );
}
