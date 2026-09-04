import { steps } from "@/lib/content";
import { Reveal } from "./reveal";

export function HowItWorks() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold leading-[1.1] text-white sm:text-4xl">
            De cero a evento en <span className="text-gradient">cuatro pasos</span>
          </h2>
        </Reveal>

        <div className="relative mt-16 grid gap-10 md:grid-cols-4 md:gap-6">
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-border md:block" />
          {steps.map((step, i) => (
            <Reveal key={step.number} delay={i * 90}>
              <div className="relative">
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-[#0d0d16] text-sm font-bold text-white">
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