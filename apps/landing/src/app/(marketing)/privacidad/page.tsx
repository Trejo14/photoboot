import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo Birdcam recopila, usa y protege tus datos y los de tus invitados.",
};

export default function PrivacidadPage() {
  return (
    <LegalPage
      title="Política de privacidad"
      updatedAt="3 de septiembre de 2026"
      intro="En Birdcam manejamos dos tipos de datos: los tuyos como operador de la cabina, y las fotografías de los invitados de tu evento. Esta política explica cómo tratamos ambos."
      sections={[
        {
          heading: "1. Datos que recopilamos",
          body: (
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Datos de cuenta: nombre, correo y organización al registrarte.</li>
              <li>Datos de facturación: procesados directamente por Stripe, no almacenamos números de tarjeta.</li>
              <li>
                Fotografías capturadas en tus eventos, junto con metadatos técnicos
                (evento, cabina, fecha) necesarios para generar el marco, el QR y la
                galería de descarga.
              </li>
              <li>Datos técnicos básicos de la cabina (nombre, última conexión) para el panel de monitoreo.</li>
            </ul>
          ),
        },
        {
          heading: "2. Cómo usamos los datos",
          body: (
            <p>
              Usamos tus datos para operar el servicio: procesar las fotos con IA,
              generar los códigos QR de entrega, administrar tu suscripción y
              darte soporte. No vendemos tus datos ni los de tus invitados a
              terceros.
            </p>
          ),
        },
        {
          heading: "3. Dónde se almacenan las fotos",
          body: (
            <p>
              Las fotografías se almacenan en infraestructura de almacenamiento de
              objetos compatible con S3. Se conservan mientras tu cuenta esté
              activa; puedes solicitar la eliminación de las fotos de un evento en
              cualquier momento escribiéndonos.
            </p>
          ),
        },
        {
          heading: "4. Con quién compartimos información",
          body: (
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong className="text-foreground/90">Stripe</strong> — procesamiento de pagos y suscripciones.</li>
              <li><strong className="text-foreground/90">Proveedor de correo</strong> — envío de códigos de acceso y notificaciones transaccionales.</li>
              <li>
                Los invitados de tu evento acceden a sus propias fotos mediante el QR
                que tú les entregas — nosotros no distribuimos esas fotos por
                ningún otro canal.
              </li>
            </ul>
          ),
        },
        {
          heading: "5. Tus derechos",
          body: (
            <p>
              Puedes solicitar acceso, rectificación, cancelación u oposición
              (derechos ARCO) sobre tus datos personales en cualquier momento,
              escribiendo a{" "}
              <a href="mailto:birdstackmx@gmail.com" className="text-brand-pink hover:underline">
                birdstackmx@gmail.com
              </a>
              . Responderemos en un plazo máximo de 20 días hábiles.
            </p>
          ),
        },
        {
          heading: "6. Fotografías de menores de edad",
          body: (
            <p>
              En eventos como XV años o cumpleaños infantiles es común fotografiar
              a menores de edad. Como operador de la cabina, eres responsable de
              contar con el consentimiento correspondiente de madres, padres o
              tutores antes de capturar y entregar estas fotografías.
            </p>
          ),
        },
        {
          heading: "7. Seguridad",
          body: (
            <p>
              Aplicamos controles de acceso y cifrado en tránsito para proteger la
              información almacenada. Ningún sistema es 100% infalible, por lo que
              te recomendamos mantener actualizadas tus credenciales y no
              compartir tu clave de licencia.
            </p>
          ),
        },
        {
          heading: "8. Contacto",
          body: (
            <p>
              Para cualquier duda sobre esta política, escríbenos a{" "}
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
