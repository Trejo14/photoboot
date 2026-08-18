"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@photobooth/ui";

interface Props {
  onRegister: (info: { eventId: string; boothName: string }) => Promise<void>;
}

export function SetupScreen({ onRegister }: Props) {
  const [eventId, setEventId] = useState("");
  const [boothName, setBoothName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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