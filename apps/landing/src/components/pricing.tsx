"use client";

import { useState } from "react";
import { cn } from "@photobooth/ui";
import { plans, type Plan } from "@/lib/content";
import { Reveal } from "./reveal";
import { ArrowRightIcon, CheckIcon, XIcon } from "./icons";

type Billing = "monthly" | "yearly";

function formatPrice(plan: Plan, billing: Billing) {
  if (plan.id === "lifetime") return { price: "$4,990", suffix: "pago único" };
  if (plan.id === "free") return { price: "$0", suffix: "gratis para siempre" };
  return {
    price: billing === "monthly" ? "$399" : "$3,588",
    suffix: billing === "monthly" ? "/mes" : "/año",
  };
}

export function Pricing() {
  const [billing, setBilling] = useState<Billing>("yearly");

  return (
    <section id="precios" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-pink">
            Precios
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Planes que crecen contigo
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Empieza gratis y escala cuando tu negocio lo pida. Sin cargos
            ocultos, cancela cuando quieras.
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-10 flex items-center justify-center gap-4">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
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
                  "flex h-full flex-col rounded-3xl p-8",
                  plan.highlighted
                    ? "rounded-[calc(1.5rem-1px)] bg-[#0d0d16]"
                    : "border border-white/8 bg-card"
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  {plan.badge ? (
                    <span className="rounded-full bg-gradient-to-r from-brand-violet to-brand-pink px-3 py-1 text-xs font-bold text-white">
                      {plan.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{plan.tagline}</p>

                <div className="mt-7 flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tight text-white">{price}</span>
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

                <a
                  href="#"
                  className={cn(
                    "mt-10 h-11 w-full text-base",
                    plan.highlighted ? "btn-gradient" : "btn-ghost"
                  )}
                >
                  {plan.cta}
                  {plan.highlighted ? <ArrowRightIcon className="size-4" /> : null}
                </a>
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
                  <div className="gradient-border h-full shadow-[0_30px_90px_-30px_rgba(219,39,119,0.4)]">
                    {card}
                  </div>
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
              href="#"
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