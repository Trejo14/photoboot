import { useEffect, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@photobooth/ui";
import { LogoBirdcam } from "./logo";
import {
  PowerIcon,
  CalendarIcon,
  LogOutIcon,
  LockIcon,
} from "./icons";
import { verifyAdminPin } from "@/lib/auth";
import { invoke, listen, exitKioskMode, isFullscreen } from "@/lib/tauri";

interface Props {
  onSwitchEvent: () => void;
  onLogout: () => void;
}

type View = "pin" | "menu";

export function AdminMenuModal({ onSwitchEvent, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("pin");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inKiosk, setInKiosk] = useState(false);

  useEffect(() => {
    void listen<unknown>("admin-unlock", async () => {
      setPin("");
      setError(null);
      setView("pin");
      setOpen(true);
      setInKiosk(await isFullscreen());
    });
  }, []);

  async function handlePinSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const valid = await verifyAdminPin(pin.trim());
      if (valid) {
        setView("menu");
      } else {
        setError("PIN incorrecto");
      }
    } catch {
      setError("No se pudo validar el PIN");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setView("pin");
    setPin("");
    setError(null);
  }

  async function handleExit() {
    handleClose();
    await invoke("exit_app");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      {view === "pin" ? (
        <Card className="w-full max-w-xs animate-fade-in">
          <CardHeader>
            <div className="flex justify-center">
              <LogoBirdcam size="6" className="text-white" />
            </div>
            <CardTitle className="text-center text-lg">
              Modo administrador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-2">
                  <LockIcon className="h-4 w-4 text-muted-foreground" />
                  Ingrese su PIN
                </label>
                <Input
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  placeholder="••••"
                  className="text-center tracking-[0.3em]"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, ""));
                    setError(null);
                  }}
                  maxLength={6}
                />
              </div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={handleClose}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || pin.length < 4}>
                  {loading ? "…" : "Entrar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-sm animate-fade-in">
          <CardHeader>
            <div className="flex justify-center">
              <LogoBirdcam size="6" className="text-white" />
            </div>
            <CardTitle className="text-center text-lg">
              Panel de administración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inKiosk && (
                <button
                  onClick={async () => {
                    await exitKioskMode();
                    setInKiosk(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-[#22d3ee]/20 bg-[#22d3ee]/5 p-3 text-left transition-colors hover:bg-[#22d3ee]/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[#22d3ee]">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-[#22d3ee]">Salir del modo cabina</p>
                    <p className="text-xs text-[#22d3ee]/60">Restaurar ventana con controles</p>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  handleClose();
                  onSwitchEvent();
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-white/10"
              >
                <CalendarIcon className="h-5 w-5 text-[#a78bfa]" />
                <div>
                  <p className="text-sm font-medium text-white">Cambiar de evento</p>
                  <p className="text-xs text-white/40">Seleccionar otro evento activo</p>
                </div>
              </button>

              <button
                onClick={() => {
                  handleClose();
                  onLogout();
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-white/10"
              >
                <LogOutIcon className="h-5 w-5 text-[#f472b6]" />
                <div>
                  <p className="text-sm font-medium text-white">Cerrar sesión</p>
                  <p className="text-xs text-white/40">Volver a la pantalla de login</p>
                </div>
              </button>

              <div className="border-t border-white/10 pt-2 mt-2">
                <button
                  onClick={handleExit}
                  className="flex w-full items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-left transition-colors hover:bg-red-500/10"
                >
                  <PowerIcon className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-red-300">Cerrar aplicación</p>
                    <p className="text-xs text-red-400/60">Salir de Birdcam completamente</p>
                  </div>
                </button>
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full mt-4"
              onClick={handleClose}
            >
              Volver
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
