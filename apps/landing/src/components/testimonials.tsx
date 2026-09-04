import { testimonials } from "@/lib/content";
import { Reveal } from "./reveal";

export function Testimonials() {
  return (
    <section id="casos" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold leading-[1.1] text-white sm:text-4xl">
            Creado para los momentos que{" "}
            <span className="text-gradient">nadie olvida</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 80}>
              <figure className="card-lift flex h-full flex-col rounded-xl border border-border bg-card p-7">
                <span className="w-fit rounded-md bg-brand-violet/15 px-3 py-1 text-xs font-semibold text-brand-violet">
                  {t.type}
                </span>
                <blockquote className="mt-5 flex-1 text-sm leading-relaxed text-foreground/90">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-violet text-sm font-bold text-[#0a0a10]">
                    {t.name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}