import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { DownloadIcon } from "@/components/icons";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "¡Pago exitoso!",
  description: "Revisa tu correo para tu ID de membresía Birdcam.",
  robots: { index: false, follow: false },
};

export default function SuccessPage() {
  return (
    <section className="relative pb-24 pt-32 lg:pb-32 lg:pt-40">
      <div className="mx-auto max-w-xl px-5 text-center lg:px-8">
        <Reveal>
          <h1 className="font-display text-3xl font-bold leading-[1.1] text-white sm:text-4xl">
            ¡Pago confirmado!
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Te enviamos un correo con tu ID de membresía. Ábrelo y pégalo
            dentro de la app de Birdcam para activar tu plan.
          </p>
        </Reveal>

        <Reveal delay={80} className="mt-10 rounded-xl border border-border bg-card p-6 text-left">
          <ol className="space-y-4 text-sm text-muted-foreground">
            <li>1. Revisa tu bandeja de entrada (y spam) por el correo de Birdcam.</li>
            <li>2. Descarga e instala la app si aún no lo has hecho.</li>
            <li>3. Abre la app, inicia sesión y pega tu ID de membresía cuando te lo pida.</li>
          </ol>
        </Reveal>

        <Reveal delay={120} className="mt-10">
          <a
            href={env.NEXT_PUBLIC_DOWNLOAD_URL}
            className="btn-gradient inline-flex h-12 px-7 text-base"
            download
          >
            Descargar la cabina
            <DownloadIcon className="size-4" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
