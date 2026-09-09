import { Button } from "@photobooth/ui";

interface Props {
  error: string | null;
  feedback?: string | null;
  onRetry: () => void;
  onSkip: () => void;
}

export function ImprimiendoScreen({ error, feedback, onRetry, onSkip }: Props) {
  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-red-400"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Error de impresión
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {error}
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" size="lg" onClick={onSkip}>
            Omitir
          </Button>
          <Button size="lg" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-black p-4">
      <div className="relative">
        <div className="h-20 w-20 rounded-full border-4 border-white/10 border-t-[#22d3ee] animate-spin" />
      </div>
      <h2 className="text-2xl font-bold text-white">
        {feedback ?? "Imprimiendo tu foto..."}
      </h2>
      <p className="text-sm text-white/60">
        No cierres la aplicación
      </p>
    </div>
  );
}
