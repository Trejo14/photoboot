import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { steps } from "@/lib/content";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "Birdcam es software de photobooth con IA hecho en México, para fotógrafos y rentadores de cabinas que quieren eventos memorables.",
};

const values = [
  {
    title: "Hecho para el evento real",
    description:
      "Bodas, XV años, corporativos: diseñamos Birdcam probándolo en eventos de verdad, no en un laboratorio. Cada función responde a un problema que vimos en piso.",
  },
  {
    title: "Funciona aunque falle el internet",
    description:
      "Salones, haciendas y recintos sin Wi-Fi estable son la norma, no la excepción. Por eso el modo offline no es un extra: es la base del producto.",
  },
  {
    title: "Simple para el operador, mágico para el invitado",
    description:
      "Quien renta la cabina debe poder montarla en dos minutos. Quien se toma la foto debe sorprenderse con el resultado. Diseñamos para ambos.",
  },
];

export default function NosotrosPage() {
  return (
    <section className="relative pb-24 pt-32 lg:pb-32 lg:pt-40">
      <div className="mx-auto max-w-4xl px-5 lg:px-8">
        <Reveal className="max-w-2xl">
          <h1 className="font-display text-3xl font-bold leading-[1.1] text-white sm:text-4xl">
            Cabinas de fotos con IA, hechas en México
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Birdcam nació de una pregunta simple: ¿por qué rentar una cabina de
            fotos sigue siendo tan complicado? Entre configuraciones eternas,
            software que se cae sin internet y fotos que tardan en llegar a los
            invitados, vimos una industria entera esperando algo mejor.
            Construimos Birdcam para fotógrafos y rentadores que quieren montar
            una cabina, capturar recuerdos increíbles con IA, y entregar todo
            al instante — sin dolores de cabeza técnicos.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {values.map((value, i) => (
            <Reveal key={value.title} delay={i * 80}>
              <div className="h-full rounded-xl border border-border bg-card p-6">
                <h2 className="text-base font-bold text-white">{value.title}</h2>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mt-20">
          <h2 className="font-display text-xl font-bold text-white">Cómo llegamos hasta aquí</h2>
          <ol className="mt-6 space-y-6 border-l border-border pl-6">
            {steps.map((step) => (
              <li key={step.number} className="relative">
                <span className="absolute -left-[1.95rem] flex h-4 w-4 items-center justify-center rounded-full bg-brand-violet" />
                <h3 className="text-base font-semibold text-white">
                  Paso {step.number} — {step.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Ese mismo flujo — crear evento, capturar, transformar con IA, entregar
            por QR — es hoy el corazón de Birdcam en cada cabina que se conecta.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
