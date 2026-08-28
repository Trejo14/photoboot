import { Reveal } from "./reveal";
import { ArrowRightIcon, PlayIcon } from "./icons";

export function FinalCta() {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0d16] px-6 py-16 text-center sm:px-16 lg:py-24">
            <div className="glow-orb left-1/2 top-[-30%] h-72 w-[34rem] -translate-x-1/2 bg-brand-violet/25" />
            <div className="glow-orb bottom-[-40%] right-[-10%] h-72 w-72 bg-brand-cyan/15" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
                Empieza tu primer evento{" "}
                <span className="text-gradient">gratis</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
                Crea tu cuenta, monta tu primera cabina y sorprende a tus
                invitados hoy mismo. Sin tarjeta de crédito.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href="#precios" className="btn-gradient h-12 w-full px-8 text-base sm:w-auto">
                  Empezar gratis
                  <ArrowRightIcon className="size-4" />
                </a>
                <a href="#producto" className="btn-ghost h-12 w-full px-8 text-base sm:w-auto">
                  <PlayIcon className="size-4" />
                  Ver demo
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}