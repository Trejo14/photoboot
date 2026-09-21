import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@photobooth/ui";
import { activateLicense, type LicenseInfo } from "@/lib/license";
import { errorMessage } from "@/lib/errors";

interface Props {
  deviceToken: string;
  email: string | null;
  blocked?: boolean;
  onActivated: (license: LicenseInfo) => void;
  onCancel?: () => void;
}

export function LicenseScreen({
  deviceToken,
  email,
  blocked = false,
  onActivated,
  onCancel,
}: Props) {
  const [licenseKey, setLicenseKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const license = await activateLicense(
        deviceToken,
        licenseKey.trim(),
        email,
      );
      onActivated(license);
    } catch (err) {
      setError(errorMessage(err, "No se pudo activar la licencia"));
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle
            className={`text-center ${blocked ? "text-destructive" : ""}`}
          >
            {blocked ? "Suscripción vencida" : "Activar licencia"}
          </CardTitle>
          <CardDescription className="text-center">
            {blocked
              ? "Tu suscripción venció. Ingresa una clave de licencia vigente para seguir usando la cabina."
              : "Ingresa la clave de licencia Pro o Lifetime para desbloquear todas las funciones."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Clave de licencia</label>
              <Input
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                required
                autoFocus
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              {onCancel ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={onCancel}
                >
                  Volver
                </Button>
              ) : null}
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Activando…" : "Activar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
