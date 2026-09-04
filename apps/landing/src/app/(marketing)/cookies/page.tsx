import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "Qué cookies usa Birdcam y cómo controlarlas.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Política de cookies"
      updatedAt="3 de septiembre de 2026"
      intro="Somos breves porque no hay mucho que contar: este sitio (birdcam.app) no usa cookies de rastreo ni de terceros, no tiene analítica de publicidad y no vende datos de navegación a nadie."
      sections={[
        {
          heading: "1. Este sitio (la página que estás viendo)",
          body: (
            <p>
              La página pública de Birdcam es contenido estático: no coloca
              cookies, no usa píxeles de seguimiento ni comparte tu actividad de
              navegación con redes publicitarias.
            </p>
          ),
        },
        {
          heading: "2. Panel de administración",
          body: (
            <p>
              El panel de administración (donde gestionas eventos, cabinas y
              licencias) sí utiliza una cookie de sesión estrictamente
              necesaria para mantenerte con la sesión iniciada. Esta cookie no
              se usa con fines publicitarios y se elimina al cerrar sesión.
            </p>
          ),
        },
        {
          heading: "3. Cómo controlarlas",
          body: (
            <p>
              Puedes borrar o bloquear cookies desde la configuración de tu
              navegador en cualquier momento. Bloquear la cookie de sesión del
              panel de administración simplemente hará que tengas que iniciar
              sesión de nuevo con más frecuencia.
            </p>
          ),
        },
        {
          heading: "4. Cambios futuros",
          body: (
            <p>
              Si en el futuro incorporamos analítica o cookies adicionales,
              actualizaremos esta página y, cuando la ley lo requiera, te
              pediremos tu consentimiento explícito antes de activarlas.
            </p>
          ),
        },
        {
          heading: "5. Contacto",
          body: (
            <p>
              ¿Preguntas sobre esta política? Escríbenos a{" "}
              <a href="mailto:birdstackmx@gmail.com" className="text-brand-pink hover:underline">
                birdstackmx@gmail.com
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
