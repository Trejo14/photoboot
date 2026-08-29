import { useEffect, useState } from "react";
import { Button, Input } from "@photobooth/ui";
import { LogoBirdcam } from "./logo";
import { CalendarIcon, ImageIcon, PlusIcon, RefreshIcon, WifiOffIcon, ExclamationIcon } from "./icons";
import { listEvents, type EventItem } from "@/lib/api";

interface Props {
  onRegister: (info: { eventId: string; boothName: string }) => Promise<void>;
}

export function EventMenuScreen({ onRegister }: Props) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [mode, setMode] = useState<"select" | "manual">("select");
  const [manualEventId, setManualEventId] = useState("");
  const [boothName, setBoothName] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  async function fetchEvents() {
    if (!navigator.onLine) {
      setLoadingEvents(false);
      setError("Sin conexión a internet. Conéctate para ver los eventos del servidor.");
      return;
    }
    setLoadingEvents(true);
    setError(null);
    try {
      const data = await listEvents();
      setEvents(data);
    } catch {
      setError("No pudimos conectar con el servidor. Verifica tu conexión a internet.");
    } finally {
      setLoadingEvents(false);
    }
  }

  useEffect(() => {
    if (mode === "select") {
      void fetchEvents();
    }
  }, [mode]);

  async function handleSelectEvent(event: EventItem) {
    setSelectedEvent(event);
    setBoothName(event.name.slice(0, 20) || "Cabina 1");
  }

  async function handleSubmitEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedEvent) return;
    setSubmitting(true);
    setError(null);
    try {
      await onRegister({ eventId: selectedEvent.id, boothName: boothName.trim() || "Cabina 1" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar la cabina");
      setSubmitting(false);
    }
  }

  async function handleManualSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onRegister({ eventId: manualEventId.trim(), boothName: boothName.trim() || "Cabina 1" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar la cabina");
      setSubmitting(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-black p-4">
      <div className="w-full max-w-lg space-y-8 animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <LogoBirdcam size="10" className="text-white" />
          <h1 className="text-2xl font-bold text-white">Seleccionar evento</h1>
          <p className="text-sm text-white/50">
            Elige el evento activo o configura la cabina manualmente.
          </p>
        </div>

        {isOffline && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <WifiOffIcon className="h-5 w-5 shrink-0 text-amber-400" />
            <p className="text-sm text-amber-300/80">
              Sin conexión a internet. Puedes configurar la cabina manualmente.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant={mode === "select" ? "default" : "secondary"}
            onClick={() => setMode("select")}
            className="flex-1"
            disabled={isOffline}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Eventos
          </Button>
          <Button
            variant={mode === "manual" ? "default" : "secondary"}
            onClick={() => setMode("manual")}
            className="flex-1"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Manual
          </Button>
        </div>

        {mode === "select" ? (
          <div className="space-y-3">
            {loadingEvents ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <RefreshIcon className="h-8 w-8 text-white/40 animate-spinner" />
                <p className="text-sm text-white/50">Cargando eventos…</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/5 py-10">
                <ExclamationIcon className="h-12 w-12 text-red-400/70" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-white">{error}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => fetchEvents()}>
                    <RefreshIcon className="mr-2 h-4 w-4" />
                    Reintentar
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setMode("manual")}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Configurar manual
                  </Button>
                </div>
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <CalendarIcon className="h-12 w-12 text-white/20" />
                <p className="text-sm text-white/50">No hay eventos disponibles.</p>
                <Button variant="secondary" size="sm" onClick={() => setMode("manual")}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Configurar manual
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleSelectEvent(event)}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      selectedEvent?.id === event.id
                        ? "border-[#a78bfa]/50 bg-[#a78bfa]/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-white">{event.name}</p>
                        <p className="text-xs text-white/40">
                          {formatDate(event.startDate)}
                          {event.endDate ? ` – ${formatDate(event.endDate)}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          {event._count.photos}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedEvent && (
              <form onSubmit={handleSubmitEvent} className="space-y-3 pt-2 animate-slide-in-right">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/70">Nombre de la cabina</label>
                  <Input
                    value={boothName}
                    onChange={(e) => setBoothName(e.target.value)}
                    placeholder="Cabina 1"
                    required
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5">
                    <ExclamationIcon className="h-4 w-4 shrink-0 text-red-400" />
                    <p className="text-xs text-red-300/80">{error}</p>
                  </div>
                )}
                <Button type="submit" className="w-full gradient-birdcam" disabled={submitting}>
                  {submitting ? "Conectando…" : "Iniciar cabina"}
                </Button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">ID del evento</label>
              <Input
                value={manualEventId}
                onChange={(e) => setManualEventId(e.target.value)}
                placeholder="demo-event"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">Nombre de la cabina</label>
              <Input
                value={boothName}
                onChange={(e) => setBoothName(e.target.value)}
                placeholder="Cabina 1"
                required
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5">
                <ExclamationIcon className="h-4 w-4 shrink-0 text-red-400" />
                <p className="text-xs text-red-300/80">{error}</p>
              </div>
            )}
            <Button type="submit" className="w-full gradient-birdcam" disabled={submitting}>
              {submitting ? "Conectando…" : "Iniciar cabina"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
