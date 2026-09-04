import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { MailIcon, ChatIcon, DownloadIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "¿Dudas sobre Birdcam? Escríbenos y te respondemos en menos de 24 horas hábiles.",
};

const channels = [
  {
    icon: MailIcon,
    title: "Ventas y soporte general",
    description: "Para dudas sobre planes, facturación o cómo empezar.",
    href: "mailto:birdstackmx@gmail.com",
    label: "birdstackmx@gmail.com",
  },
  {
    icon: ChatIcon,
    title: "Plan Enterprise",
    description: "Cabinas ilimitadas, marca blanca y soporte dedicado.",
    href: "mailto:birdstackmx@gmail.com?subject=Plan%20Enterprise",
    label: "Escríbenos sobre Enterprise",
  },
  {
    icon: DownloadIcon,
    title: "Ya tengo Birdcam instalado",
    description: "Soporte prioritario para clientes PRO y LIFETIME por correo.",
    href: "mailto:birdstackmx@gmail.com?subject=Soporte%20t%C3%A9cnico",
    label: "Soporte técnico",
  },
];

export default function ContactoPage() {
  return (
    <section className="relative pb-24 pt-32 lg:pb-32 lg:pt-40">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <Reveal className="max-w-xl">
          <h1 className="font-display text-3xl font-bold leading-[1.1] text-white sm:text-4xl">
            Hablemos
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Respondemos por correo en menos de 24 horas hábiles. Elige el motivo
            de tu mensaje y te dirigimos con el equipo correcto.
          </p>
        </Reveal>

        <div className="mt-12 space-y-4">
          {channels.map((channel, i) => (
            <Reveal key={channel.title} delay={i * 80}>
              <a
                href={channel.href}
                className="card-lift flex items-start gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:border-brand-violet/40"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center text-brand-violet">
                  <channel.icon className="size-6" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-white">{channel.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{channel.description}</p>
                  <p className="mt-2 text-sm font-semibold text-brand-pink">{channel.label}</p>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
