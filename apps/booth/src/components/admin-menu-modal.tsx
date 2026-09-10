import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@photobooth/ui";
import { LogoBirdcam } from "./logo";
import {
  PowerIcon,
  CalendarIcon,
  LogOutIcon,
  LockIcon,
  SettingsIcon,
  PrinterIcon,
} from "./icons";
import { invoke, listen, exitKioskMode, isFullscreen } from "@/lib/tauri";
import { getSettings, saveSettings, type Settings } from "@/lib/settings";
import { PrintSettingsPanel } from "./print-settings-panel";

interface Props {
  onSwitchEvent: () => void;
  onLogout: () => void;
  onSettingsChange?: (settings: Settings) => void;
  lastPhoto: { blob: Blob; imageUrl: string } | null;
}

type View = "pin" | "menu" | "settings" | "print";

interface CameraDevice {
  deviceId: string;
  label: string;
}

export function AdminMenuModal({
  onSwitchEvent,
  onLogout,
  onSettingsChange,
  lastPhoto,
}: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("pin");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inKiosk, setInKiosk] = useState(false);
  const [settings, setSettingsState] = useState<Settings | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);

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
      const current = await getSettings();
      if (pin.trim() === current.adminPin) {
        setSettingsState(current);
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

  async function openSettings() {
    setView("settings");
    if (!settings) setSettingsState(await getSettings());
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const cams = devices
        .filter((d) => d.kind === "videoinput")
        .map((d) => ({ deviceId: d.deviceId, label: d.label || "Cámara" }));
      setCameras(cams);
    });
  }

  async function updateSettings(patch: Partial<Settings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettingsState(next);
    await saveSettings(next);
    onSettingsChange?.(next);
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
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={handleClose}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading || pin.length < 4}
                >
                  {loading ? "…" : "Entrar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : view === "settings" ? (
        <Card className="w-full max-w-sm animate-fade-in">
          <CardHeader>
            <div className="flex justify-center">
              <LogoBirdcam size="6" className="text-white" />
            </div>
            <CardTitle className="text-center text-lg">Configuración</CardTitle>
          </CardHeader>
          <CardContent>
            {!settings ? (
              <p className="text-center text-sm text-muted-foreground">
                Cargando…
              </p>
            ) : (
              <div className="space-y-4">
                {cameras.length > 1 && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Cámara</label>
                    <select
                      value={settings.cameraDeviceId ?? ""}
                      onChange={(e) =>
                        void updateSettings({
                          cameraDeviceId: e.target.value || null,
                        })
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Automática</option>
                      {cameras.map((c) => (
                        <option key={c.deviceId} value={c.deviceId}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Tiempo de vista final (
                    {(settings.photoDisplayMs / 1000).toFixed(1)}s)
                  </label>
                  <input
                    type="range"
                    min={3000}
                    max={20000}
                    step={500}
                    value={settings.photoDisplayMs}
                    onChange={(e) =>
                      void updateSettings({
                        photoDisplayMs: Number(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-white/40">
                    Cuánto se muestra la foto compuesta antes de imprimir.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Tiempo de pantalla de QR (
                    {(settings.thanksDisplayMs / 1000).toFixed(1)}s)
                  </label>
                  <input
                    type="range"
                    min={5000}
                    max={30000}
                    step={500}
                    value={settings.thanksDisplayMs}
                    onChange={(e) =>
                      void updateSettings({
                        thanksDisplayMs: Number(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-white/40">
                    Cuánto se muestra el QR de descarga antes de reiniciar para
                    el siguiente invitado.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    PIN de administrador
                  </label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    value={settings.adminPin}
                    onChange={(e) =>
                      void updateSettings({ adminPin: e.target.value })
                    }
                    placeholder="1234"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setView("menu")}
                  >
                    Volver
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={handleClose}
                  >
                    Listo
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : view === "print" ? (
        <Card className="w-full max-w-sm animate-fade-in">
          <CardHeader>
            <div className="flex justify-center">
              <LogoBirdcam size="6" className="text-white" />
            </div>
            <CardTitle className="text-center text-lg">
              Configuración de impresión
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!settings ? (
              <p className="text-center text-sm text-muted-foreground">
                Cargando…
              </p>
            ) : (
              <PrintSettingsPanel
                settings={settings}
                onSettingsChange={(patch) => void updateSettings(patch)}
                lastPhoto={lastPhoto}
                onBack={() => setView("menu")}
              />
            )}
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-[#22d3ee]"
                  >
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-[#22d3ee]">
                      Salir del modo cabina
                    </p>
                    <p className="text-xs text-[#22d3ee]/60">
                      Restaurar ventana con controles
                    </p>
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
                  <p className="text-sm font-medium text-white">
                    Cambiar de evento
                  </p>
                  <p className="text-xs text-white/40">
                    Seleccionar otro evento activo
                  </p>
                </div>
              </button>

              <button
                onClick={() => void openSettings()}
                className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-white/10"
              >
                <SettingsIcon className="h-5 w-5 text-[#34d399]" />
                <div>
                  <p className="text-sm font-medium text-white">
                    Configuración
                  </p>
                  <p className="text-xs text-white/40">Cámara, tiempos y PIN</p>
                </div>
              </button>

              <button
                onClick={async () => {
                  setView("print");
                  if (!settings) setSettingsState(await getSettings());
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-white/10"
              >
                <PrinterIcon className="h-5 w-5 text-[#f59e0b]" />
                <div>
                  <p className="text-sm font-medium text-white">Impresión</p>
                  <p className="text-xs text-white/40">
                    Impresora, orientación, papel y copias
                  </p>
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
                  <p className="text-sm font-medium text-white">
                    Cerrar sesión
                  </p>
                  <p className="text-xs text-white/40">
                    Volver a la pantalla de login
                  </p>
                </div>
              </button>

              <div className="border-t border-white/10 pt-2 mt-2">
                <button
                  onClick={handleExit}
                  className="flex w-full items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-left transition-colors hover:bg-red-500/10"
                >
                  <PowerIcon className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-red-300">
                      Cerrar aplicación
                    </p>
                    <p className="text-xs text-red-400/60">
                      Salir de Birdcam completamente
                    </p>
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
