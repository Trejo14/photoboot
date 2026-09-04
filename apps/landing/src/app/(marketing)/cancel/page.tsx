import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Pago cancelado",
  description: "Tu pago fue cancelado, no se realizó ningún cargo.",
  robots: { index: false, follow: false },
};

export default function CancelPage() {
  return (
    <section className="relative pb-24 pt-32 lg:pb-32 lg:pt-40">
      <div className="mx-auto max-w-xl px-5 text-center lg:px-8">
        <Reveal>
          <h1 className="font-display text-3xl font-bold leading-[1.1] text-white sm:text-4xl">
            Pago cancelado
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
            No se realizó ningún cargo. Puedes intentarlo de nuevo cuando
            quieras desde nuestros planes.
          </p>
        </Reveal>

        <Reveal delay={80} className="mt-10">
          <Link href="/#precios" className="btn-gradient inline-flex h-12 px-7 text-base">
            Volver a planes
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
