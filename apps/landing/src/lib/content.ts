export interface PlanFeature {
  label: string;
  included: boolean;
}

export interface Plan {
  id: "free" | "pro" | "lifetime";
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  oneTime?: boolean;
  highlighted: boolean;
  badge?: string;
  cta: string;
  features: PlanFeature[];
}

export const plans: Plan[] = [
  {
    id: "free",
    name: "FREE",
    tagline: "Para probarla en tu primer evento.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    highlighted: false,
    cta: "Empezar gratis",
    features: [
      { label: "2 eventos al mes", included: true },
      { label: "Entrega de fotos por QR", included: true },
      { label: "Plantillas básicas", included: true },
      { label: "Marca de agua Birdcam", included: true },
      { label: "IA generativa", included: false },
      { label: "Multi-cabina", included: false },
      { label: "Sin marca de agua", included: false },
    ],
  },
  {
    id: "pro",
    name: "PRO",
    tagline: "Para rentadores de cabina en serio.",
    monthlyPrice: 399,
    yearlyPrice: 299,
    highlighted: true,
    badge: "Más popular",
    cta: "Probar 14 días gratis",
    features: [
      { label: "Eventos ilimitados", included: true },
      { label: "Sin marca de agua", included: true },
      { label: "IA generativa incluida", included: true },
      { label: "Entrega por QR ilimitada", included: true },
      { label: "Hasta 3 cabinas simultáneas", included: true },
      { label: "Editor de plantillas premium", included: true },
      { label: "Modo sin internet", included: true },
      { label: "Soporte prioritario", included: true },
    ],
  },
  {
    id: "lifetime",
    name: "LIFETIME",
    tagline: "Paga una vez. Úsala para siempre.",
    monthlyPrice: 4990,
    yearlyPrice: 4990,
    oneTime: true,
    highlighted: false,
    cta: "Comprar de por vida",
    features: [
      { label: "Todas las funciones PRO para siempre", included: true },
      { label: "Actualizaciones incluidas de por vida", included: true },
      { label: "Cabinas ilimitadas", included: true },
      { label: "Marca blanca completa", included: true },
      { label: "Modo sin internet", included: true },
      { label: "Soporte por correo", included: true },
      { label: "Asesoría personalizada 1:1", included: false },
    ],
  },
];

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export const features: Feature[] = [
  {
    icon: "sparkles",
    title: "IA generativa",
    description:
      "Estilos de IA que transforman cada foto al instante: stickers con nombres, fondos creativos y retoques que sorprenden.",
  },
  {
    icon: "wifi-off",
    title: "Funciona sin internet",
    description:
      "Modo offline real: las fotos se guardan localmente y sincronizan solas cuando vuelve la conexión.",
  },
  {
    icon: "qr",
    title: "Entrega por QR",
    description:
      "Tus invitados escanean un código y descargan sus fotos al instante, sin apps ni cuentas.",
  },
  {
    icon: "layers",
    title: "Multi-cabina",
    description:
      "Controla varias cabinas desde un solo panel. Regístralas, monitoréalas y exporta todo desde un lugar.",
  },
  {
    icon: "template",
    title: "Editor de plantillas",
    description:
      "Diseña marcos, logos y plantillas a medida en minutos, sin saber diseño ni editar código.",
  },
  {
    icon: "zap",
    title: "Listo en 2 minutos",
    description:
      "Sin instalación ni configuración técnica. Conecta la cámara y tu evento está en vivo.",
  },
];

export interface Step {
  number: string;
  title: string;
  description: string;
}

export const steps: Step[] = [
  {
    number: "01",
    title: "Crea tu evento",
    description:
      "Registra tu evento en el panel y genera el QR que vincula la tablet de la cabina.",
  },
  {
    number: "02",
    title: "Captura",
    description:
      "La app abre sola con la cámara lista. Cuenta regresiva, flash y a posar.",
  },
  {
    number: "03",
    title: "La IA transforma",
    description:
      "Cada foto se procesa con tu plantilla y los estilos de IA que elegiste.",
  },
  {
    number: "04",
    title: "QR y listo",
    description:
      "Los invitados escanean, descargan y comparten. Tú recibes todo en tu panel.",
  },
];

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  type: string;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      "Rentamos Birdcam en 12 bodas este año. La configuración tomó dos minutos y los estilos de IA fueron lo más compartido por los invitados.",
    name: "María y Luis",
    role: "Fotógrafos de boda · Guadalajara",
    type: "Bodas",
  },
  {
    quote:
      "Para los XV de mi hija, la cabina con IA fue el centro de la fiesta. Los stickers con su nombre volaron en redes sociales.",
    name: "Ana Sofía M.",
    role: "Mamá de la quinceañera · CDMX",
    type: "XV Años",
  },
  {
    quote:
      "Usamos Birdcam en un evento de 800 personas con 4 cabinas sincronizadas. Todo el material llegó al panel en tiempo real.",
    name: "Roberto D.",
    role: "Agencia de eventos · Monterrey",
    type: "Corporativos",
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const faqs: FaqItem[] = [
  {
    question: "¿Cómo funciona la licencia?",
    answer:
      "Cada licencia cubre el software Birdcam y las cabinas según tu plan. La instalas en tu equipo y la usas en todos tus eventos. PRO es suscripción mensual o anual; LIFETIME es un solo pago sin renovaciones.",
  },
  {
    question: "¿Cuántas cabinas puedo conectar?",
    answer:
      "FREE incluye 1 cabina, PRO hasta 3 simultáneas y LIFETIME no tiene límite. Si necesitas más cabinas, el plan Enterprise las añade sin restricciones.",
  },
  {
    question: "¿De verdad funciona sin internet?",
    answer:
      "Sí. Las fotos se guardan localmente en la cabina y se sincronizan automáticamente cuando hay conexión. Perfecto para salones, haciendas y recintos sin Wi-Fi estable.",
  },
  {
    question: "¿Qué incluye la IA?",
    answer:
      "Estilos generativos, stickers con nombres, fondos creativos y retoques automáticos. Puedes usar la biblioteca de estilos o aplicar tus propias plantillas.",
  },
  {
    question: "¿Cómo entrego las fotos a los invitados?",
    answer:
      "Cada foto genera un QR único. Los invitados lo escanean y descargan la foto al instante, sin apps ni cuentas. Tú también recibes el material completo en tu panel.",
  },
  {
    question: "¿Puedo cambiar o cancelar mi plan?",
    answer:
      "Sí, cuando quieras. La suscripción PRO se cancela desde el panel y LIFETIME es un pago único sin renovaciones ni cargos ocultos.",
  },
  {
    question: "¿Qué soporte incluye?",
    answer:
      "PRO y LIFETIME incluyen soporte prioritario por correo y WhatsApp. FREE tiene soporte por comunidad y documentación. Enterprise incluye soporte dedicado.",
  },
];

export const socialProof = [
  "Bodas",
  "XV Años",
  "Corporativos",
  "Cumpleaños",
  "Graduaciones",
  "Lanzamientos",
  "Ferias",
  "Brandings",
];

export const navLinks = [
  { label: "Producto", href: "#producto" },
  { label: "Descargar", href: "#descargar" },
  { label: "Precios", href: "#precios" },
  { label: "Casos de uso", href: "#casos" },
  { label: "FAQ", href: "#faq" },
];

export interface DownloadStep {
  title: string;
  description: string;
}

export const downloadSteps: DownloadStep[] = [
  {
    title: "Abre la app en tu tablet",
    description:
      "Entra al enlace de Birdcam desde la tablet de la cabina. Se abre sola, sin instaladores.",
  },
  {
    title: "Añádela a la pantalla de inicio",
    description:
      "Así se instala como app (PWA): funciona a pantalla completa y guarda las fotos sin internet.",
  },
  {
    title: "Conecta tu evento y captura",
    description:
      "Pega el ID del evento, confirma la cabina y la cámara queda lista con su cuenta regresiva.",
  },
];

export const footerLinks = {
  Producto: [
    { label: "Funciones", href: "#producto" },
    { label: "Precios", href: "#precios" },
    { label: "Casos de uso", href: "#casos" },
    { label: "FAQ", href: "#faq" },
  ],
  Empresa: [
    { label: "Nosotros", href: "#" },
    { label: "Contacto", href: "#" },
    { label: "Prensa", href: "#" },
    { label: "Blog", href: "#" },
  ],
  Legal: [
    { label: "Términos", href: "#" },
    { label: "Privacidad", href: "#" },
    { label: "Cookies", href: "#" },
  ],
};