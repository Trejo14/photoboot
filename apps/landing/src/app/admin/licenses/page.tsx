import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { adminFetch } from "@/lib/admin-api";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@photobooth/ui";
import type { LicenseSummary, ManualOrderSummary } from "@photobooth/types";

export const dynamic = "force-dynamic";

async function revokeLicense(formData: FormData) {
  "use server";
  const id = formData.get("id");
  if (typeof id === "string" && id) {
    try {
      await adminFetch(`/licenses/${id}/revoke`, { method: "POST" });
    } catch {
      // la página vuelve a cargar y muestra el error real del listado
    }
  }
  revalidatePath("/admin/licenses");
}

async function fulfillManualOrder(formData: FormData) {
  "use server";
  const id = formData.get("id");
  if (typeof id === "string" && id) {
    try {
      await adminFetch(`/licenses/manual-orders/${id}/fulfill`, {
        method: "POST",
      });
    } catch {
      // la página vuelve a cargar y muestra el error real del listado
    }
  }
  revalidatePath("/admin/licenses");
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("es");
}

export default async function LicensesPage() {
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }

  let licenses: LicenseSummary[] = [];
  let error: string | null = null;
  try {
    licenses = await adminFetch<LicenseSummary[]>("/licenses");
  } catch (err) {
    error = err instanceof Error ? err.message : "Error desconocido";
  }

  let manualOrders: ManualOrderSummary[] = [];
  try {
    manualOrders = await adminFetch<ManualOrderSummary[]>(
      "/licenses/manual-orders",
    );
  } catch {
    // si falla, simplemente no mostramos la sección de pedidos
  }
  const pendingOrders = manualOrders.filter((o) => o.status === "pending");

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Licencias</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las licencias de las cabinas
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Volver
        </Link>
      </header>

      {error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            No se pudo cargar la API: {error}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Pedidos manuales (SPEI / PayPal)</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingOrders.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No hay pedidos pendientes.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Referencia</th>
                    <th className="py-2 pr-4 font-medium">Método</th>
                    <th className="py-2 pr-4 font-medium">Correo</th>
                    <th className="py-2 pr-4 font-medium">Plan</th>
                    <th className="py-2 pr-4 font-medium">Monto</th>
                    <th className="py-2 pr-4 font-medium">Fecha</th>
                    <th className="py-2 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map((order) => (
                    <tr key={order.id} className="border-b">
                      <td className="py-2 pr-4 font-mono">{order.reference}</td>
                      <td className="py-2 pr-4 uppercase">{order.method}</td>
                      <td className="py-2 pr-4">{order.email}</td>
                      <td className="py-2 pr-4 capitalize">
                        {order.plan}
                        {order.interval ? ` (${order.interval})` : ""}
                      </td>
                      <td className="py-2 pr-4">
                        ${order.amount.toLocaleString("es-MX")} MXN
                      </td>
                      <td className="py-2 pr-4">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-2 text-right">
                        <form action={fulfillManualOrder}>
                          <input type="hidden" name="id" value={order.id} />
                          <Button type="submit" size="sm">
                            Marcar pagado y emitir licencia
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
        </CardHeader>
        <CardContent>
          {licenses.length === 0 && !error ? (
            <p className="text-center text-muted-foreground">
              No hay licencias todavía.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Clave</th>
                    <th className="py-2 pr-4 font-medium">Plan</th>
                    <th className="py-2 pr-4 font-medium">Estado</th>
                    <th className="py-2 pr-4 font-medium">Organización</th>
                    <th className="py-2 pr-4 font-medium">Cabinas</th>
                    <th className="py-2 pr-4 font-medium">Activada</th>
                    <th className="py-2 pr-4 font-medium">Último check-in</th>
                    <th className="py-2 pr-4 font-medium">Caduca</th>
                    <th className="py-2 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map((lic) => (
                    <tr key={lic.id} className="border-b">
                      <td className="py-2 pr-4 font-mono">{lic.licenseKey}</td>
                      <td className="py-2 pr-4 capitalize">{lic.plan}</td>
                      <td className="py-2 pr-4">
                        <Badge
                          variant={
                            lic.status === "revoked" ? "destructive" : "default"
                          }
                        >
                          {lic.status}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4">
                        {lic.organization?.name ?? "—"}
                      </td>
                      <td className="py-2 pr-4">
                        {lic.activeDevices} / {lic.maxBooths}
                      </td>
                      <td className="py-2 pr-4">
                        {formatDate(lic.activatedAt)}
                      </td>
                      <td className="py-2 pr-4">
                        {formatDate(lic.lastValidatedAt)}
                      </td>
                      <td className="py-2 pr-4">{formatDate(lic.expiresAt)}</td>
                      <td className="py-2 text-right">
                        {lic.status === "active" ? (
                          <form action={revokeLicense}>
                            <input type="hidden" name="id" value={lic.id} />
                            <Button
                              type="submit"
                              variant="destructive"
                              size="sm"
                            >
                              Revocar
                            </Button>
                          </form>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
