import type { ReactNode } from "react";
import { ChevronLeftIcon, PowerIcon } from "./icons";

interface Props {
  canGoBack: boolean;
  onBack: () => void;
  onExit: () => void;
  children: ReactNode;
}

// Wraps every screen so "Volver" and "Salir" are always in the same place
// and can never be forgotten on a new screen. "Volver" dims (but stays in
// place) on screens with no sensible previous step instead of disappearing,
// so the layout never shifts. "Salir" is always active — App.tsx decides
// whether it aborts the current guest session or closes the app.
export function BoothLayout({ canGoBack, onBack, onExit, children }: Props) {
  return (
    <>
      {children}
      <button
        onClick={onBack}
        disabled={!canGoBack}
        aria-label="Volver"
        title="Volver"
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/70 backdrop-blur transition hover:border-white/30 hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <button
        onClick={onExit}
        aria-label="Salir"
        title="Salir"
        className="fixed right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/70 backdrop-blur transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
      >
        <PowerIcon className="h-5 w-5" />
      </button>
    </>
  );
}
