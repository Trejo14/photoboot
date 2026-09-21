import { useState } from "react";
import { Button, Card, CardContent } from "@photobooth/ui";
import { LogoBirdcam } from "./logo";
import { ExclamationIcon } from "./icons";
import { apiRequest, getAuthToken } from "@/lib/api";
import { isTauri } from "@/lib/tauri";
import { errorMessage } from "@/lib/errors";

interface Props {
  onPlanSelected: (plan: "free" | "pro" | "lifetime") => void;
  onBack: () => void;
}

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: "free" | "pro" | "lifetime";
  name: string;
  price: string;
  period: string;
  badge?: string;
  features: PlanFeature[];
  cta: string;
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "para siempre",
    features: [
      { text: "2 eventos por mes", included: true },
      { text: "Entrega por QR", included: true },
      { text: "Watermark de Birdcam", included: true },
      { text: "Marcos y plantillas", included: false },
      { text: "IA generativa", included: false },
      { text: "Multi-booth", included: false },
      { text: "Sin marca de agua", included: false },
    ],
    cta: "Empezar gratis",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$399",
    period: "/mes",
    badge: "Más popular",
    highlighted: true,
    features: [
      { text: "Eventos ilimitados", included: true },
      { text: "Sin marca de agua", included: true },
      { text: "IA incluida", included: true },
      { text: "QR ilimitado", included: true },
      { text: "Hasta 3 cabinas", included: true },
      { text: "Plantillas premium", included: true },
      { text: "Soporte prioritario", included: true },
    ],
    cta: "Probar 14 días gratis",
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: "$4,990",
    period: "pago único",
    features: [
      { text: "Todo de Pro, para siempre", included: true },
      { text: "Actualizaciones de por vida", included: true },
      { text: "Cabinas ilimitadas", included: true },
      { text: "Marca blanca completa", included: true },
      { text: "Modo offline", included: true },
      { text: "Soporte por email", included: true },
      { text: "Sin asesoría 1:1", included: false },
    ],
    cta: "Comprar de por vida",
  },
];

export function PlanSelector({ onPlanSelected, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelectPlan(planId: "free" | "pro" | "lifetime") {
    if (planId === "free") {
      onPlanSelected("free");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        setError("No hay sesión activa. Inicia sesión primero.");
        return;
      }

      const data = await apiRequest<{ url: string }>("/payments/checkout", {
        method: "POST",
        body: JSON.stringify({
          plan: planId,
          interval: planId === "lifetime" ? "one-time" : "monthly",
        }),
      });

      if (isTauri) {
        try {
          const { invoke } = await import("@/lib/tauri");
          await invoke("open_url", { url: data.url });
        } catch {
          window.open(data.url, "_blank");
        }
      } else {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(errorMessage(err, "Error al crear sesión de pago"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0a0a0f] p-4">
      <div className="w-full max-w-3xl animate-fade-in space-y-6">
        <div className="flex flex-col items-center gap-2">
          <LogoBirdcam size="6" className="text-white" />
          <h1 className="text-xl font-semibold text-foreground">
            Elige tu plan
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Puedes empezar gratis y cambiar después.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {plans.map((plan, index) => (
            <Card
              key={plan.id}
              className={`stagger-child relative overflow-hidden transition-all ${
                plan.highlighted
                  ? "border-2 border-[#a78bfa] shadow-lg shadow-[#a78bfa]/10 scale-[1.02]"
                  : "border border-border"
              }`}
              style={{ animationDelay: `${index * 120}ms` }}
            >
              {plan.badge && (
                <div className="absolute right-2 top-2 rounded-full bg-[#a78bfa] px-2 py-0.5 text-xs font-medium text-white">
                  {plan.badge}
                </div>
              )}
              <CardContent className="p-5 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {plan.name}
                  </h2>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <svg
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          f.included
                            ? "text-[#22d3ee]"
                            : "text-muted-foreground/40"
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {f.included ? (
                          <polyline points="20 6 9 17 4 12" />
                        ) : (
                          <>
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </>
                        )}
                      </svg>
                      <span
                        className={
                          f.included
                            ? "text-foreground"
                            : "text-muted-foreground/50"
                        }
                      >
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full ${
                    plan.highlighted ? "gradient-birdcam" : ""
                  }`}
                  variant={plan.highlighted ? "default" : "secondary"}
                  disabled={loading}
                >
                  {loading ? "Procesando…" : plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            <ExclamationIcon className="h-4 w-4 shrink-0 text-red-400" />
            <p className="text-sm text-red-300/80">{error}</p>
          </div>
        )}

        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-muted-foreground"
          >
            Volver
          </Button>
        </div>
      </div>
    </main>
  );
}
