import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { apiFetch } from "@/lib/admin-api";
import { Badge, Card, CardContent } from "@photobooth/ui";

export const dynamic = "force-dynamic";

interface EventDetail {
  id: string;
  name: string;
  themeConfig: { colors?: { primary?: string } };
  booths: { id: string; name: string; lastSeenAt: string | null }[];
  photos: {
    id: string;
    originalUrl: string;
    status: string;
    type: string;
    createdAt: string;
  }[];
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;

  let event: EventDetail;
  try {
    event = await apiFetch<EventDetail>(`/events/${id}`);
  } catch {
    notFound();
  }

  const primary = event.themeConfig?.colors?.primary ?? "#4f46e5";

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
            ← Volver
          </Link>
          <h1 className="mt-1 text-2xl font-bold" style={{ color: primary }}>
            {event.name}
          </h1>
        </div>
        <Badge>{event.photos.length} fotos</Badge>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Cabinas</h2>
        <div className="flex flex-wrap gap-2">
          {event.booths.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay cabinas registradas.
            </p>
          ) : (
            event.booths.map((booth) => (
              <Card key={booth.id} className="px-4 py-2">
                <CardContent className="p-0">
                  <p className="text-sm font-medium">{booth.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {booth.lastSeenAt
                      ? `Vista: ${new Date(booth.lastSeenAt).toLocaleString()}`
                      : "Sin conexión aún"}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Fotos</h2>
        {event.photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay fotos. Captúralas desde la cabina.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {event.photos.map((photo) => (
              <figure key={photo.id} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.originalUrl}
                  alt={`Foto ${photo.type}`}
                  className="aspect-square w-full rounded-lg object-cover"
                />
                <figcaption className="absolute bottom-2 left-2">
                  <Badge variant={photo.status === "ready" ? "success" : "secondary"}>
                    {photo.status}
                  </Badge>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
