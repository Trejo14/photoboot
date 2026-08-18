"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@photobooth/ui";
import { env } from "@/lib/env";

export function CreateEventForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [organizationId, setOrganizationId] = useState("demo-org");
  const [primaryColor, setPrimaryColor] = useState("#4f46e5");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          organizationId,
          startDate: new Date(`${startDate}T00:00:00`).toISOString(),
          themeConfig: { colors: { primary: primaryColor } },
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const event = (await res.json()) as { id: string };
      router.push(`/events/${event.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el evento");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos del evento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Organización</label>
            <Input
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fecha de inicio</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Color principal</label>
            <Input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-20 p-1"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creando…" : "Crear evento"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}