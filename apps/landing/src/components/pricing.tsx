"use client";

import { useState } from "react";
import { cn } from "@photobooth/ui";
import { plans, type Plan } from "@/lib/content";
import { Reveal } from "./reveal";
import { CheckIcon, XIcon } from "./icons";
import { env } from "@/lib/env";

type Billing = "monthly" | "yearly";

// Stripe aún no está activo (pendiente de verificación de negocio). Cuando esté
// listo, cambia esto a true para volver a mostrar "Pagar con tarjeta".
const CARD_PAYMENTS_ENABLED = false;

function formatPrice(plan: Plan, billing: Billing) {
  if (plan.id === "lifetime") return { price: "$4,990", suffix: "pago único" };
  if (plan.id === "free") return { price: "$0", suffix: "gratis para siempre" };
  return {
    price: billing === "monthly" ? "$399" : "$3,588",
    suffix: billing === "monthly" ? "/mes" : "/año",
  };
}

interface ManualOrderResult {
  method: "spei" | "paypal";
  reference: string;
  amount: number;
  clabe?: string | null;
  bankName?: string | null;
  beneficiary?: string | null;
  paypalMeLink?: string | null;
  paypalEmail?: string | null;
}

function PlanCta({ plan, billing }: { plan: Plan; billing: Billing }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading-card" | "loading-spei" | "loading-paypal" | "error"
  >("idle");
  const [manualOrder, setManualOrder] = useState<ManualOrderResult | null>(null);

  const ctaClass = cn("mt-10 h-11 w-full text-base", plan.highlighted ? "btn-gradient" : "btn-ghost");

  if (plan.id === "free") {
    return (
      <a href="#descargar" className={ctaClass}>
        {plan.cta}
      </a>
    );
  }

  async function handleCardCheckout() {
    if (!email || status !== "idle") return;
    setStatus("loading-card");
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/payments/license-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          plan: plan.id,
          interval: plan.id === "pro" ? billing : undefined,
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = (await res.json()) as { url: string };
      window.location.href = data.url;
    } catch {
      setStatus("error");
    }
  }

  async function handleManualCheckout(method: "spei" | "paypal") {
    if (!email || status !== "idle") return;
    setStatus(method === "spei" ? "loading-spei" : "loading-paypal");
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/licenses/manual-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          plan: plan.id,
          interval: plan.id === "pro" ? billing : undefined,
          method,
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = (await res.json()) as ManualOrderResult;
      setManualOrder(data);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  if (manualOrder) {
    return (
      <div className="mt-10 space-y-3 rounded-lg border border-border bg-white/5 p-4 text-left text-sm">
        {manualOrder.method === "paypal" ? (
          <>
            <p className="font-semibold text-white">Paga con PayPal:</p>
            <dl className="space-y-1.5 text-muted-foreground">
              <div className="flex justify-between gap-3">
                <dt>PayPal.me</dt>
                <dd className="font-mono text-foreground">{manualOrder.paypalMeLink ?? "Pendiente"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>O envía a</dt>
                <dd className="text-foreground">{manualOrder.paypalEmail ?? "Pendiente"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Monto</dt>
                <dd className="text-foreground">${manualOrder.amount.toLocaleString("es-MX")} MXN</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Referencia (ponla en la nota)</dt>
                <dd className="font-mono text-brand-violet">{manualOrder.reference}</dd>
              </div>
            </dl>
          </>
        ) : (
          <>
            <p className="font-semibold text-white">Transfiere por SPEI:</p>
            <dl className="space-y-1.5 text-muted-foreground">
              <div className="flex justify-between gap-3">
                <dt>CLABE</dt>
                <dd className="font-mono text-foreground">{manualOrder.clabe ?? "Pendiente"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Banco</dt>
                <dd className="text-foreground">{manualOrder.bankName ?? "Pendiente"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Beneficiario</dt>
                <dd className="text-foreground">{manualOrder.beneficiary ?? "Pendiente"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Monto</dt>
                <dd className="text-foreground">${manualOrder.amount.toLocaleString("es-MX")} MXN</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Referencia (ponla en el concepto)</dt>
                <dd className="font-mono text-brand-violet">{manualOrder.reference}</dd>
              </div>
            </dl>
          </>
        )}
        <p className="text-xs text-muted-foreground">
          En cuanto confirmemos tu pago te enviamos tu ID de membresía por correo.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={ctaClass}>
        {plan.cta}
      </button>
    );
  }

  return (
    <div className="mt-10 space-y-2">
      <label className="sr-only" htmlFor={`email-${plan.id}`}>
        Correo electrónico
      </label>
      <input
        id={`email-${plan.id}`}
        type="email"
        required
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@correo.com"
        className="h-11 w-full rounded-lg border border-border bg-white/5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-violet/60 focus:outline-none focus:ring-1 focus:ring-brand-violet/40"
      />
      {CARD_PAYMENTS_ENABLED ? (
        <button
          type="button"
          onClick={handleCardCheckout}
          disabled={status !== "idle"}
          className={cn(ctaClass, "mt-0 disabled:opacity-60")}
        >
          {status === "loading-card" ? "Redirigiendo…" : "Pagar con tarjeta"}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => handleManualCheckout("spei")}
        disabled={status !== "idle"}
        className={cn(
          CARD_PAYMENTS_ENABLED ? "btn-ghost h-11 w-full text-sm" : cn(ctaClass, "mt-0"),
          "disabled:opacity-60"
        )}
      >
        {status === "loading-spei" ? "Generando referencia…" : "Pagar por transferencia (SPEI)"}
      </button>
      <button
        type="button"
        onClick={() => handleManualCheckout("paypal")}
        disabled={status !== "idle"}
        className="btn-ghost h-11 w-full text-sm disabled:opacity-60"
      >
        {status === "loading-paypal" ? "Generando referencia…" : "Pagar con PayPal"}
      </button>
      {status === "error" ? (
        <p className="text-xs text-red-400">No se pudo iniciar el pago. Intenta de nuevo.</p>
      ) : null}
    </div>
  );
}

export function Pricing() {
  const [billing, setBilling] = useState<Billing>("yearly");

  return (
    <section id="precios" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold leading-[1.1] text-white sm:text-4xl">
            Planes que crecen contigo
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Empieza gratis y escala cuando tu negocio lo pida. Sin cargos
            ocultos, cancela cuando quieras.
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-10 flex items-center justify-center gap-4">
          <div className="inline-flex rounded-full border border-border bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-semibold transition-colors",
                billing === "monthly" ? "bg-white text-black" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setBilling("yearly")}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-semibold transition-colors",
                billing === "yearly" ? "bg-white text-black" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Anual
            </button>
          </div>
          <span className="rounded-full bg-brand-pink/15 px-3 py-1 text-xs font-semibold text-brand-pink">
            Ahorra 25%
          </span>
        </Reveal>

        <div className="mt-14 grid items-stretch gap-6 md:grid-cols-3">
          {plans.map((plan, i) => {
            const { price, suffix } = formatPrice(plan, billing);
            const card = (
              <div
                className={cn(
                  "flex h-full flex-col rounded-xl p-8",
                  plan.highlighted
                    ? "rounded-[calc(0.75rem-1px)] bg-[#0d0d16]"
                    : "border border-border bg-card"
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  {plan.badge ? (
                    <span className="rounded-md bg-brand-violet px-3 py-1 text-xs font-bold text-[#0a0a10]">
                      {plan.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{plan.tagline}</p>

                <div className="mt-7 flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">{price}</span>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {plan.id === "pro" && billing === "yearly"
                    ? "Equivale a $299/mes · Ahorras $1,200 al año"
                    : suffix}
                </p>

                <ul className="mt-8 space-y-3.5">
                  {plan.features.map((feature) => (
                    <li key={feature.label} className="flex items-start gap-3 text-sm">
                      {feature.included ? (
                        <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand-cyan" />
                      ) : (
                        <XIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
                      )}
                      <span className={feature.included ? "text-foreground/90" : "text-muted-foreground/60"}>
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>

                <PlanCta plan={plan} billing={billing} />
              </div>
            );

            return (
              <Reveal
                key={plan.id}
                delay={i * 80}
                className={cn(
                  plan.highlighted && "order-first md:order-none md:-my-4 md:scale-[1.03]"
                )}
              >
                {plan.highlighted ? (
                  <div className="gradient-border h-full">{card}</div>
                ) : (
                  card
                )}
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={200} className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            ¿Necesitas más cabinas o marca blanca?{" "}
            <a
              href="mailto:birdstackmx@gmail.com?subject=Plan%20Enterprise"
              className="font-semibold text-brand-pink underline-offset-4 transition-colors hover:text-brand-cyan hover:underline"
            >
              Contáctanos
            </a>{" "}
            para el plan Enterprise.
          </p>
        </Reveal>
      </div>
    </section>
  );
}