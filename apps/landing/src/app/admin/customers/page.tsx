import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { adminFetch } from "@/lib/admin-api";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@photobooth/ui";
import type { CustomerSummary } from "@photobooth/types";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }

  let customers: CustomerSummary[] = [];
  let error: string | null = null;
  try {
    customers = await adminFetch<CustomerSummary[]>("/licenses/customers");
  } catch (err) {
    error = err instanceof Error ? err.message : "Error desconocido";
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Todos los que compraron un plan o iniciaron sesión en la web
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
          <CardTitle>Listado ({customers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 && !error ? (
            <p className="text-center text-muted-foreground">
              No hay clientes todavía.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Correo</th>
                    <th className="py-2 pr-4 font-medium">Nombre</th>
                    <th className="py-2 pr-4 font-medium">Plan</th>
                    <th className="py-2 pr-4 font-medium">Clave del plan</th>
                    <th className="py-2 pr-4 font-medium">Cuenta</th>
                    <th className="py-2 font-medium">Desde</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.email} className="border-b align-top">
                      <td className="py-2 pr-4">{customer.email}</td>
                      <td className="py-2 pr-4">{customer.name ?? "—"}</td>
                      <td className="py-2 pr-4 capitalize">{customer.plan}</td>
                      <td className="py-2 pr-4">
                        {customer.licenses.length === 0 ? (
                          <span className="text-muted-foreground">
                            {customer.pendingOrders > 0
                              ? "Pago pendiente"
                              : "—"}
                          </span>
                        ) : (
                          <ul className="space-y-1">
                            {customer.licenses.map((license) => (
                              <li
                                key={license.licenseKey}
                                className="flex flex-wrap items-center gap-2"
                              >
                                <span className="font-mono">
                                  {license.licenseKey}
                                </span>
                                <span className="capitalize text-muted-foreground">
                                  {license.plan}
                                </span>
                                {license.status === "revoked" ? (
                                  <Badge variant="destructive">revocada</Badge>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {customer.registered ? "Sí" : "Solo compra"}
                      </td>
                      <td className="py-2">
                        {new Date(customer.firstSeenAt).toLocaleDateString(
                          "es",
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
