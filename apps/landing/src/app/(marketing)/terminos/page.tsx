import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Términos de servicio",
  description: "Términos y condiciones de uso de Birdcam.",
};

export default function TerminosPage() {
  return (
    <LegalPage
      title="Términos de servicio"
      updatedAt="3 de septiembre de 2026"
      intro="Estos términos rigen el uso de Birdcam (la aplicación de escritorio, el panel de administración y los servicios asociados). Al descargar, instalar o usar Birdcam aceptas estos términos."
      sections={[
        {
          heading: "1. Descripción del servicio",
          body: (
            <p>
              Birdcam es un software de cabina de fotos (photobooth) que permite
              capturar fotografías, procesarlas con estilos de inteligencia
              artificial, aplicarles plantillas de marco y entregarlas a los
              invitados de un evento mediante un código QR. Incluye una app de
              escritorio para Windows y un panel de administración web para
              gestionar eventos, cabinas y licencias.
            </p>
          ),
        },
        {
          heading: "2. Cuentas y planes",
          body: (
            <>
              <p>
                Ofrecemos tres planes: <strong className="text-foreground/90">FREE</strong>{" "}
                (gratuito, con límites de eventos y marca de agua),{" "}
                <strong className="text-foreground/90">PRO</strong> (suscripción
                mensual o anual) y <strong className="text-foreground/90">LIFETIME</strong>{" "}
                (pago único). Las características de cada plan se describen en
                nuestra página de precios y pueden actualizarse con previo aviso.
              </p>
              <p>
                Eres responsable de mantener la confidencialidad de tus
                credenciales de acceso y de toda actividad que ocurra bajo tu
                cuenta.
              </p>
            </>
          ),
        },
        {
          heading: "3. Pagos y facturación",
          body: (
            <p>
              Los pagos de los planes PRO y LIFETIME se procesan a través de
              Stripe. Las suscripciones PRO se renuevan automáticamente según el
              periodo elegido (mensual o anual) hasta que se cancelen desde el
              panel. El plan LIFETIME es un pago único sin renovaciones ni cargos
              recurrentes. No ofrecemos reembolsos por periodos ya facturados,
              salvo que la ley aplicable indique lo contrario.
            </p>
          ),
        },
        {
          heading: "4. Uso aceptable",
          body: (
            <p>
              No debes usar Birdcam para capturar, procesar o distribuir
              contenido ilegal, difamatorio o que infrinja derechos de terceros.
              Como operador de la cabina, eres responsable de obtener el
              consentimiento de los invitados de tu evento para tomar y entregar
              sus fotografías.
            </p>
          ),
        },
        {
          heading: "5. Propiedad intelectual",
          body: (
            <p>
              El software, las plantillas incluidas y los estilos de IA
              proporcionados por Birdcam son propiedad de Birdcam o de sus
              licenciantes. Las fotografías capturadas por ti y tus invitados te
              pertenecen a ti como operador del evento.
            </p>
          ),
        },
        {
          heading: "6. Limitación de responsabilidad",
          body: (
            <p>
              Birdcam se ofrece &ldquo;tal cual&rdquo;. En la medida permitida
              por la ley, no somos responsables por pérdidas indirectas,
              pérdida de datos por fallas de hardware del equipo del cliente, o
              interrupciones causadas por conectividad de internet en el lugar
              del evento — por eso el modo offline existe como mitigación, pero
              recomendamos siempre respaldar el material capturado.
            </p>
          ),
        },
        {
          heading: "7. Cambios a estos términos",
          body: (
            <p>
              Podemos actualizar estos términos ocasionalmente. Los cambios
              relevantes se notificarán por correo o dentro del panel de
              administración con al menos 15 días de anticipación.
            </p>
          ),
        },
        {
          heading: "8. Contacto",
          body: (
            <p>
              ¿Dudas sobre estos términos? Escríbenos a{" "}
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
