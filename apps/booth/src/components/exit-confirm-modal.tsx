import { Button } from "@photobooth/ui";
import { invoke } from "@/lib/tauri";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ExitConfirmModal({ open, onClose }: Props) {
  if (!open) return null;

  async function handleExit() {
    try {
      await invoke("exit_app");
    } catch {
      window.close();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="glass relative z-10 w-full max-w-sm rounded-2xl p-6 animate-fade-in">
        <h2 className="text-lg font-semibold text-foreground text-center">
          ¿Cerrar Birdcam?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          Se cerrará la aplicación y perderás el acceso a la cabina hasta que la vuelvas a abrir.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 gradient-birdcam"
            onClick={handleExit}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
