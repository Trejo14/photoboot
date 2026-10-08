import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { adminFetch } from "@/lib/admin-api";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@photobooth/ui";
import type { EventSummary } from "@photobooth/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }

  let events: EventSummary[] = [];
  let error: string | null = null;
  try {
    events = await adminFetch<EventSummary[]>("/events/admin");
  } catch (err) {
    error = err instanceof Error ? err.message : "Error desconocido";
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Eventos</h1>
          <p className="text-sm text-muted-foreground">Hola, {session.user?.name}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/customers"
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Clientes
          </Link>
          <Link
            href="/admin/licenses"
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Licencias
          </Link>
          <Link
            href="/admin/events/new"
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Crear evento
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <Button type="submit" variant="ghost">
              Salir
            </Button>
          </form>
        </div>
      </header>

      {error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            No se pudo cargar la API: {error}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((event) => (
          <Link key={event.id} href={`/admin/events/${event.id}`} className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>{event.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4 text-sm text-muted-foreground">
                <span>{event._count?.booths ?? 0} cabinas</span>
                <span>{event._count?.photos ?? 0} fotos</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {events.length === 0 && !error ? (
        <p className="text-center text-muted-foreground">No hay eventos todavía.</p>
      ) : null}
    </main>
  );
}
