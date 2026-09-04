import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { NewsletterForm } from "@/components/newsletter-form";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "El blog de Birdcam está en construcción. Suscríbete para recibir tips de eventos, plantillas nuevas y estilos de IA antes que nadie.",
};

const upcoming = [
  "Cómo armar el setup perfecto de cabina para bodas al aire libre",
  "5 estilos de IA que más comparten los invitados en redes",
  "Multi-cabina: cómo cubrir un evento de 500+ personas sin fallar",
];

export default function BlogPage() {
  return (
    <section className="relative pb-24 pt-32 lg:pb-32 lg:pt-40">
      <div className="mx-auto max-w-2xl px-5 text-center lg:px-8">
        <Reveal>
          <h1 className="font-display text-3xl font-bold leading-[1.1] text-white sm:text-4xl">
            El blog de Birdcam está en construcción
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Estamos preparando guías, casos de uso y novedades de producto.
            Déjanos tu correo y te avisamos en cuanto publiquemos el primer
            artículo.
          </p>
        </Reveal>

        <Reveal delay={100} className="mx-auto mt-8 max-w-sm">
          <NewsletterForm />
        </Reveal>

        <Reveal delay={160} className="mt-16 text-left">
          <h2 className="font-display text-lg font-bold text-white">En camino</h2>
          <ul className="mt-4 space-y-3">
            {upcoming.map((title) => (
              <li
                key={title}
                className="rounded-xl border border-border bg-white/[0.02] px-4 py-3 text-sm text-muted-foreground"
              >
                {title}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
