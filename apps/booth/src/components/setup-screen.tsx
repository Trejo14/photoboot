import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@photobooth/ui";
import { getSettings, saveSettings, type Settings } from "@/lib/settings";
import { invoke, isTauri } from "@/lib/tauri";

interface Props {
  onRegister: (info: { eventId: string; boothName: string }) => Promise<void>;
}

interface CameraDevice {
  deviceId: string;
  label: string;
}

export function SetupScreen({ onRegister }: Props) {
  const [eventId, setEventId] = useState("");
  const [boothName, setBoothName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [settings, setSettingsState] = useState<Settings | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);

  useEffect(() => {
    void getSettings().then((s) => setSettingsState(s));
    void navigator.mediaDevices.enumerateDevices().then((devices) => {
      const cams = devices
        .filter((d) => d.kind === "videoinput")
        .map((d) => ({ deviceId: d.deviceId, label: d.label || "Cámara" }));
      setCameras(cams);
    });
  }, []);

  async function updateSettings(patch: Partial<Settings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettingsState(next);
    await saveSettings(next);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onRegister({ eventId: eventId.trim(), boothName: boothName.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar la cabina");
      setLoading(false);
    }
  }

  if (!settings) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background p-4">
        <p className="text-muted-foreground">Cargando configuración…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">Configurar cabina</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">ID del evento</label>
              <Input
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="demo-event"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nombre de la cabina</label>
              <Input
                value={boothName}
                onChange={(e) => setBoothName(e.target.value)}
                placeholder="Cabina 1"
                required
              />
            </div>

            {cameras.length > 1 ? (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Cámara</label>
                <select
                  value={settings.cameraDeviceId ?? ""}
                  onChange={(e) =>
                    updateSettings({
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
            ) : null}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                PIN de administrador
              </label>
              <Input
                type="password"
                inputMode="numeric"
                value={settings.adminPin}
                onChange={(e) => updateSettings({ adminPin: e.target.value })}
                placeholder="1234"
              />
              <p className="text-xs text-muted-foreground">
                Ctrl+Shift+Q abre el cierre de sesión del administrador.
              </p>
            </div>

            {isTauri ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.autostart}
                  onChange={(e) => {
                    const next = e.target.checked;
                    void updateSettings({ autostart: next });
                    void invoke("set_autostart", { enabled: next }).catch(() =>
                      updateSettings({ autostart: !next })
                    );
                  }}
                  className="h-4 w-4"
                />
                Iniciar con el sistema
              </label>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registrando…" : "Continuar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}