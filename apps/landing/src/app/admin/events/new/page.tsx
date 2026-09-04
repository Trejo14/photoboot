import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { CreateEventForm } from "@/components/admin/create-event-form";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 p-6">
      <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
        ← Volver
      </Link>
      <h1 className="text-2xl font-bold">Nuevo evento</h1>
      <CreateEventForm />
    </main>
  );
}
