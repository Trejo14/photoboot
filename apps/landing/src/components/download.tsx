import { downloadSteps } from "@/lib/content";
import { env } from "@/lib/env";
import { Reveal } from "./reveal";
import { BoothSetupMockup, IpadFrame } from "./mockups";
import { ArrowRightIcon, CheckIcon } from "./icons";

export function Download() {
  return (
    <section id="descargar" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-pink">
            Descargar
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Instala la cabina en tu <span className="text-gradient">tablet</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            No hay instaladores ni configuraciones técnicas. Solo abre la app,
            conéctala a tu evento y captura.
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-16">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-[#0d0d16]">
            <div className="glow-orb left-[-8%] top-[-25%] h-64 w-64 bg-brand-violet/20" />
            <div className="glow-orb bottom-[-30%] right-[-5%] h-72 w-72 bg-brand-cyan/12" />
            <div className="grid items-center gap-12 px-6 py-14 sm:px-12 lg:grid-cols-2 lg:px-16">
              <div className="relative order-2 mx-auto w-full max-w-xs lg:order-1 lg:max-w-sm">
                <div className="absolute -inset-8 rounded-full bg-brand-pink/15 blur-3xl" />
                <IpadFrame className="relative rotate-1">
                  <BoothSetupMockup />
                </IpadFrame>
              </div>

              <div className="order-1 lg:order-2">
                <ol className="space-y-7">
                  {downloadSteps.map((step, i) => (
                    <li key={step.title} className="flex gap-5">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-brand-pink">
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <a href={env.NEXT_PUBLIC_BOOTH_URL} className="btn-gradient h-12 px-7 text-base">
                    Abrir la cabina
                    <ArrowRightIcon className="size-4" />
                  </a>
                  <a href={env.NEXT_PUBLIC_ADMIN_URL} className="btn-ghost h-12 px-7 text-base">
                    Panel de admin
                  </a>
                </div>

                <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckIcon className="size-4 text-green-500" />
                  Compatible con iPad y tablets Android (Chrome / Safari)
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}