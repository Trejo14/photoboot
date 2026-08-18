"use client";

interface Props {
  online: boolean;
  pending: number;
  syncing: boolean;
}

export function StatusBar({ online, pending, syncing }: Props) {
  const status = !online
    ? "Sin conexión"
    : syncing
      ? "Sincronizando…"
      : pending > 0
        ? `${pending} foto${pending > 1 ? "s" : ""} pendiente${pending > 1 ? "s" : ""}`
        : "Listo";

  const dotClass = !online
    ? "bg-red-500"
    : syncing || pending > 0
      ? "bg-amber-500"
      : "bg-green-500";

  return (
    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/70 px-4 py-2 text-sm text-white">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        <span>{status}</span>
      </div>
      {!online ? <span>Las fotos se guardan localmente</span> : null}
    </div>
  );
}