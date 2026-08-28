import { steps } from "@/lib/content";
import { Reveal } from "./reveal";

export function HowItWorks() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-pink">
            Cómo funciona
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            De cero a evento en <span className="text-gradient">cuatro pasos</span>
          </h2>
        </Reveal>

        <div className="relative mt-16 grid gap-10 md:grid-cols-4 md:gap-6">
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-brand-violet/40 via-brand-pink/40 to-brand-cyan/40 md:block" />
          {steps.map((step, i) => (
            <Reveal key={step.number} delay={i * 90}>
              <div className="relative">
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#0d0d16] text-sm font-bold text-white shadow-lg">
                  {step.number}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}