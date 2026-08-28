import type { ReactNode } from "react";
import { cn } from "@photobooth/ui";

export function IpadFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-[2.6rem] border border-white/10 bg-[#15151d] p-3 shadow-[0_40px_120px_-30px_rgba(139,92,246,0.35)]",
        className
      )}
    >
      <div className="pointer-events-none absolute left-1/2 top-1.5 z-20 h-1.5 w-14 -translate-x-1/2 rounded-full bg-white/20" />
      <div className="relative overflow-hidden rounded-[2rem] bg-black">{children}</div>
    </div>
  );
}

export function PhotoScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id="scene-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c3aed" />
          <stop offset="0.5" stopColor="#db2777" />
          <stop offset="1" stopColor="#0e7490" />
        </linearGradient>
        <radialGradient id="scene-glow" cx="0.5" cy="0.42" r="0.65">
          <stop offset="0" stopColor="#22d3ee" stopOpacity="0.85" />
          <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="500" fill="url(#scene-bg)" />
      <rect width="400" height="500" fill="url(#scene-glow)" />
      <g fill="#0b0b14">
        <circle cx="172" cy="300" r="26" />
        <path d="M120 362c0-42 26-66 52-66s52 24 52 66v8H120z" />
        <circle cx="248" cy="318" r="30" />
        <path d="M198 362c0-44 28-72 50-72s50 28 50 72v8H198z" />
        <circle cx="304" cy="288" r="22" />
        <path d="M262 362c0-36 20-56 42-56s42 20 42 56v8H262z" />
      </g>
      <g fill="#ffffff">
        <circle cx="68" cy="92" r="3" opacity="0.9" />
        <circle cx="330" cy="72" r="2" opacity="0.7" />
        <circle cx="92" cy="202" r="2" opacity="0.6" />
        <circle cx="352" cy="238" r="3" opacity="0.8" />
        <circle cx="122" cy="122" r="1.5" opacity="0.8" />
        <circle cx="292" cy="132" r="2" opacity="0.6" />
      </g>
      <rect
        x="8"
        y="8"
        width="384"
        height="484"
        rx="18"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.18"
        strokeWidth="2"
      />
    </svg>
  );
}

export function BoothCaptureMockup() {
  return (
    <div className="relative flex aspect-[3/4] flex-col overflow-hidden rounded-[1.8rem] bg-black">
      <PhotoScene className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />
      <div className="relative z-10 flex flex-1 items-center justify-center">
        <div className="animate-pulse flex h-28 w-28 items-center justify-center rounded-full border-2 border-white/25 bg-white/5 backdrop-blur-sm">
          <span className="text-5xl font-black text-white">3</span>
        </div>
      </div>
      <div className="relative z-10 pb-16 text-center">
        <span className="inline-block rounded-full bg-white px-10 py-3.5 text-sm font-semibold text-black shadow-2xl">
          Capturar
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between bg-black/70 px-4 py-2.5 text-[11px] text-white">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Listo
        </span>
        <span>Cabina 1 · Boda Camila</span>
      </div>
    </div>
  );
}

export function BoothPreviewMockup() {
  return (
    <div className="flex aspect-[3/4] flex-col items-center justify-center gap-5 rounded-[1.8rem] bg-[#0f0f18] p-6">
      <p className="text-lg font-bold text-white">¿Listo?</p>
      <div className="relative overflow-hidden rounded-2xl shadow-2xl">
        <PhotoScene className="h-64 w-52" />
      </div>
      <div className="flex gap-3">
        <span className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-medium text-white">
          Reintentar
        </span>
        <span className="rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-black">
          Guardar foto
        </span>
      </div>
    </div>
  );
}

export function BoothSetupMockup() {
  return (
    <div className="flex aspect-[3/4] flex-col items-center justify-center rounded-[1.8rem] bg-[#0f0f18] p-6">
      <div className="w-full max-w-[16rem] rounded-2xl border border-white/10 bg-[#13131d] p-6 shadow-2xl">
        <p className="text-center text-lg font-bold text-white">Configurar cabina</p>
        <div className="mt-5 space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">ID del evento</p>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60">
              demo-event
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Nombre de la cabina</p>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60">
              Cabina 1
            </div>
          </div>
        </div>
        <span className="mt-5 block rounded-full bg-white px-5 py-2.5 text-center text-xs font-semibold text-black">
          Continuar
        </span>
      </div>
    </div>
  );
}

const QR_SIZE = 13;

export function QrMock({ className }: { className?: string }) {
  const cells: boolean[] = [];
  for (let r = 0; r < QR_SIZE; r++) {
    for (let c = 0; c < QR_SIZE; c++) {
      const finder =
        (r < 3 && c < 3) || (r < 3 && c >= QR_SIZE - 3) || (r >= QR_SIZE - 3 && c < 3);
      let on = false;
      if (finder) {
        on = r === 0 || r === 2 || c === 0 || c === 2;
      } else {
        on = ((r * 7 + c * 13 + ((r * c) % 5)) % 3) === 0;
      }
      cells.push(on);
    }
  }
  return (
    <div
      aria-hidden
      className={cn("grid gap-px rounded-lg bg-white p-2", className)}
      style={{ gridTemplateColumns: `repeat(${QR_SIZE}, 1fr)` }}
    >
      {cells.map((on, i) => (
        <div key={i} className={cn("aspect-square", on ? "bg-black" : "bg-white")} />
      ))}
    </div>
  );
}

export function GalleryQrCard() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white p-4 shadow-2xl">
      <QrMock className="w-24 shrink-0" />
      <div className="pr-2">
        <p className="text-sm font-bold text-neutral-900">Tu foto está lista</p>
        <p className="mt-0.5 text-xs text-neutral-500">Birdcam · Boda Camila</p>
      </div>
    </div>
  );
}