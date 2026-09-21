import { useEffect, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@photobooth/ui";
import { getSettings } from "@/lib/settings";
import { invoke, listen } from "@/lib/tauri";
import { errorMessage } from "@/lib/errors";

export function AdminUnlockModal() {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void listen<unknown>("admin-unlock", () => {
      setPin("");
      setError(null);
      setOpen(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const settings = await getSettings();
      if (pin.trim() === settings.adminPin) {
        await invoke("exit_app");
      } else {
        setError("PIN incorrecto");
        setLoading(false);
      }
    } catch (err) {
      setError(errorMessage(err, "No se pudo validar"));
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <Card className="w-full max-w-xs">
        <CardHeader>
          <CardTitle className="text-center text-lg">
            Modo administrador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="password"
              inputMode="numeric"
              autoFocus
              placeholder="PIN de administrador"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                Salir
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}