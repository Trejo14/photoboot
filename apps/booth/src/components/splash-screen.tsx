import { useEffect, useState } from "react";
import { LogoBirdcam } from "./logo";

interface Props {
  progress: number;
  statusText: string;
}

const STATUS_MESSAGES = [
  "Verificando cámara…",
  "Verificando licencia…",
  "Cargando eventos…",
  "Preparando cabina…",
  "Sincronizando datos…",
];

export function SplashScreen({ progress, statusText }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-black">
      <div
        className={`flex flex-col items-center gap-8 transition-opacity duration-500 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <LogoBirdcam size="20" className="text-white animate-pulse-glow" />

        <div className="w-64 space-y-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full gradient-birdcam transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="text-center text-sm text-white/60 animate-fade-in" key={statusText}>
            {statusText || STATUS_MESSAGES[0]}
          </p>
        </div>
      </div>
    </main>
  );
}

export { STATUS_MESSAGES };
