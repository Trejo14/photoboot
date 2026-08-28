import { features } from "@/lib/content";
import { Reveal } from "./reveal";
import { BoothPreviewMockup, GalleryQrCard, IpadFrame } from "./mockups";
import { CheckIcon } from "./icons";
import {
  LayersIcon,
  QrIcon,
  SparklesIcon,
  TemplateIcon,
  WifiOffIcon,
  ZapIcon,
} from "./icons";

const iconMap = {
  sparkles: SparklesIcon,
  "wifi-off": WifiOffIcon,
  qr: QrIcon,
  layers: LayersIcon,
  template: TemplateIcon,
  zap: ZapIcon,
} as const;

export function Features() {
  return (
    <section id="producto" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-pink">
            Producto
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Todo lo que tu cabina necesita,{" "}
            <span className="text-gradient">en un solo software</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            De la captura a la entrega, Birdcam se encarga de cada paso para
            que tú solo te preocupes por el evento.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap];
            return (
              <Reveal key={feature.title} delay={i * 60}>
                <div className="card-lift h-full rounded-2xl border border-white/8 bg-card p-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-violet/25 via-brand-pink/20 to-brand-cyan/25 text-brand-pink">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={120} className="mt-20">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-[#0d0d16]">
            <div className="glow-orb right-[-8%] top-[-20%] h-64 w-64 bg-brand-pink/15" />
            <div className="grid items-center gap-12 px-6 py-14 sm:px-12 lg:grid-cols-2 lg:px-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-pink">
                  Control total
                </p>
                <h3 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Cada foto, perfecta{" "}
                  <span className="text-gradient">antes de publicarse</span>
                </h3>
                <ul className="mt-7 space-y-4">
                  {[
                    "Vista previa antes de guardar: nadie se va con una foto que no quiso.",
                    "Reintenta cuantas veces necesites sin perder a los invitados.",
                    "Tú decides cuándo se publica y con qué plantilla.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-foreground/90">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand-cyan" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative mx-auto w-full max-w-xs lg:max-w-sm">
                <div className="absolute -inset-8 rounded-full bg-brand-violet/20 blur-3xl" />
                <IpadFrame className="relative -rotate-1">
                  <BoothPreviewMockup />
                </IpadFrame>
                <div className="absolute -bottom-7 -right-2 rotate-3">
                  <GalleryQrCard />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}