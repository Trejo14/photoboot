import { Reveal } from "./reveal";
import { BoothCaptureMockup, GalleryQrCard, IpadFrame } from "./mockups";
import { ArrowRightIcon, CheckIcon, PlayIcon, SparklesIcon } from "./icons";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-32 lg:pb-32 lg:pt-40">
      <div className="glow-orb left-1/2 top-[-12%] h-[26rem] w-[40rem] -translate-x-1/2 bg-brand-violet/20" />
      <div className="glow-orb right-[-12%] top-1/4 h-80 w-80 bg-brand-cyan/10" />
      <div className="glow-orb left-[-8%] bottom-0 h-72 w-72 bg-brand-pink/10" />

      <div className="mx-auto grid max-w-6xl items-center gap-16 px-5 lg:grid-cols-2 lg:gap-12 lg:px-8">
        <div className="text-center lg:text-left">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <SparklesIcon className="size-3.5 text-brand-pink" />
              Software de photobooth con IA
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 text-4xl font-bold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Cabinas de fotos con IA,{" "}
              <span className="text-gradient">listas en 2 minutos</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              Captura, la IA transforma y tus invitados descargan por QR. Sin
              instalación, sin internet y sin dolores de cabeza. Tu evento en
              vivo en minutos.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <a href="#precios" className="btn-gradient h-12 w-full px-8 text-base sm:w-auto">
                Empezar gratis
                <ArrowRightIcon className="size-4" />
              </a>
              <a href="#producto" className="btn-ghost h-12 w-full px-8 text-base sm:w-auto">
                <PlayIcon className="size-4" />
                Ver demo
              </a>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-muted-foreground lg:justify-start">
              <span className="flex items-center gap-2">
                <CheckIcon className="size-4 text-green-500" />
                Sin tarjeta de crédito
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon className="size-4 text-green-500" />
                Funciona sin internet
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon className="size-4 text-green-500" />
                Multi-cabina
              </span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200} className="relative mx-auto w-full max-w-sm lg:max-w-none">
          <div className="relative mx-auto max-w-md">
            <div className="absolute -inset-10 rounded-full bg-brand-violet/20 blur-3xl" />
            <IpadFrame className="animate-float-slow relative rotate-1">
              <BoothCaptureMockup />
            </IpadFrame>
            <div className="absolute -bottom-7 -left-2 rotate-[-5deg] sm:-left-8">
              <GalleryQrCard />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}