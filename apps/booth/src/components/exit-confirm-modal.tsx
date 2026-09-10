import { Button } from "@photobooth/ui";
import { invoke } from "@/lib/tauri";

export type ExitConfirmMode =
  "abandon-session" | "quit-app" | "abandon-printing";

interface Props {
  open: boolean;
  mode: ExitConfirmMode;
  onClose: () => void;
  onAbandonSession: () => void;
}

const COPY: Record<
  ExitConfirmMode,
  { title: string; body: string; confirm: string }
> = {
  "abandon-session": {
    title: "¿Salir de esta sesión?",
    body: "Se perderán las fotos tomadas hasta ahora y volverás al inicio para el siguiente invitado.",
    confirm: "Salir de la sesión",
  },
  "abandon-printing": {
    title: "¿Cancelar la impresión?",
    body: "Ya se envió la foto a la impresora — puede que igual salga impresa. Volverás al inicio para el siguiente invitado.",
    confirm: "Cancelar e ir al inicio",
  },
  "quit-app": {
    title: "¿Cerrar Birdcam?",
    body: "Se cerrará la aplicación y perderás el acceso a la cabina hasta que la vuelvas a abrir.",
    confirm: "Cerrar",
  },
};

export function ExitConfirmModal({
  open,
  mode,
  onClose,
  onAbandonSession,
}: Props) {
  if (!open) return null;

  const copy = COPY[mode];

  async function handleConfirm() {
    if (mode === "quit-app") {
      try {
        await invoke("exit_app");
      } catch {
        window.close();
      }
      return;
    }
    onAbandonSession();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="glass relative z-10 w-full max-w-sm rounded-2xl p-6 animate-fade-in">
        <h2 className="text-lg font-semibold text-foreground text-center">
          {copy.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          {copy.body}
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 gradient-birdcam"
            onClick={() => void handleConfirm()}
          >
            {copy.confirm}
          </Button>
        </div>
      </div>
    </div>
  );
}
