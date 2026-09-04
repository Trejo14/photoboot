import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { MailIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Prensa",
  description:
    "Recursos de prensa de Birdcam: qué es, en qué se diferencia y cómo contactar al equipo para entrevistas o cobertura.",
};

const factSheet = [
  { label: "Producto", value: "Software de photobooth con IA para eventos" },
  { label: "Fundada", value: "México" },
  { label: "Plataformas", value: "App de escritorio (Windows) + panel web de administración" },
  { label: "Planes", value: "FREE, PRO (suscripción) y LIFETIME (pago único)" },
];

export default function PrensaPage() {
  return (
    <section className="relative pb-24 pt-32 lg:pb-32 lg:pt-40">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <Reveal className="max-w-xl">
          <h1 className="font-display text-3xl font-bold leading-[1.1] text-white sm:text-4xl">
            Sala de prensa
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Recursos para periodistas y creadores de contenido que quieran
            cubrir Birdcam: qué es, qué lo hace distinto y a quién contactar.
          </p>
        </Reveal>

        <Reveal delay={80} className="mt-12 rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-bold text-white">Boilerplate</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Birdcam es un software de cabinas de fotos con inteligencia
            artificial para eventos como bodas, XV años y actividades
            corporativas. Permite a fotógrafos y rentadores montar una cabina
            en minutos, transformar cada foto con estilos generativos y
            entregarla al instante a los invitados mediante un código QR — sin
            necesidad de internet estable en el lugar del evento.
          </p>
        </Reveal>

        <Reveal delay={120} className="mt-8">
          <h2 className="text-base font-bold text-white">Datos rápidos</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {factSheet.map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-white/[0.02] p-4">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="mt-1 text-sm text-foreground/90">{item.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={160} className="mt-10">
          <a
            href="mailto:birdstackmx@gmail.com?subject=Prensa"
            className="btn-ghost inline-flex h-12 px-7 text-base"
          >
            <MailIcon className="size-4" />
            Contactar al equipo de prensa
          </a>
        </Reveal>
      </div>
    </section>
  );
}
