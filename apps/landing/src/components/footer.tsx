import { footerLinks } from "@/lib/content";
import { NewsletterForm } from "./newsletter-form";
import {
  InstagramIcon,
  LogoMark,
  TikTokIcon,
  XSocialIcon,
  YouTubeIcon,
} from "./icons";

const socials = [
  { label: "Instagram", href: "#", Icon: InstagramIcon },
  { label: "TikTok", href: "#", Icon: TikTokIcon },
  { label: "YouTube", href: "#", Icon: YouTubeIcon },
  { label: "X", href: "#", Icon: XSocialIcon },
];

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0a0a12]">
      <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <a href="#" className="flex items-center gap-2.5 text-base font-bold tracking-tight text-white">
              <LogoMark className="text-[2rem]" />
              BIRDCAM
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Cabinas de fotos con IA para eventos inolvidables. Hecho en México
              para fotógrafos y rentadores en serio.
            </p>
            <div className="mt-6 flex gap-3">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-brand-pink/40 hover:text-brand-pink"
                >
                  <Icon className="size-4.5" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-semibold text-white">Novedades</h3>
            <p className="mt-4 text-sm text-muted-foreground">
              Recibe tips, plantillas nuevas y estilos de IA antes que nadie.
            </p>
            <div className="mt-4">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Birdcam. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1.5">
            Hecho con <span className="text-brand-pink">♥</span> en México
          </p>
        </div>
      </div>
    </footer>
  );
}