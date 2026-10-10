import { invoke, isTauri } from "./tauri";
import type { PrintOrientation, PrintPaperSize } from "./settings";
import { resolvePaperMm } from "./paper-sizes";
import { mmToPx, pxToMm } from "./formats";

export interface PrinterInfo {
  name: string;
  driver: string;
  port: string;
  thermal: boolean;
}

export interface PrintOptions {
  printer?: string | null;
  copies?: number;
  orientation?: PrintOrientation;
  paperSize?: PrintPaperSize;
  customWidthMm?: number | null;
  customHeightMm?: number | null;
}

export async function listPrinters(): Promise<PrinterInfo[]> {
  if (!isTauri) return [];
  return invoke<PrinterInfo[]>("list_printers");
}

function imageToPngBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No se pudo crear el canvas"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (b) => {
            if (!b) {
              reject(new Error("toBlob falló"));
              return;
            }
            const reader = new FileReader();
            reader.onload = () =>
              resolve(String(reader.result).split(",")[1] ?? "");
            reader.onerror = () =>
              reject(new Error("No se pudo leer la imagen"));
            reader.readAsDataURL(b);
          },
          "image/png",
          1,
        );
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen"));
    };
    img.src = url;
  });
}

function loadBlobImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen"));
    };
    img.src = url;
  });
}

// Franja blanca entre las dos copias, para cortar sin comerse el marco.
const CUT_GAP_MM = 1;

// Toda impresión saca la foto DOS veces en la misma hoja (como las tiras
// clásicas de photobooth, que se cortan a la mitad), sea cual sea el
// formato elegido. Las dos copias van siempre paralelas, lado a lado en
// horizontal; solo el rollo angosto de una térmica (`stacked`) las lleva
// una sobre otra.
async function buildDoubleSheet(blob: Blob, stacked = false): Promise<Blob> {
  const img = await loadBlobImage(blob);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const gap = mmToPx(CUT_GAP_MM);

  const canvas = document.createElement("canvas");
  canvas.width = stacked ? w : w * 2 + gap;
  canvas.height = stacked ? h * 2 + gap : h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el canvas");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  if (stacked) ctx.drawImage(img, 0, h + gap);
  else ctx.drawImage(img, w + gap, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob falló"))),
      "image/jpeg",
      0.95,
    );
  });
}

export async function printThermal(
  blob: Blob,
  options: PrintOptions = {},
): Promise<void> {
  const pngBase64 = await imageToPngBase64(blob);
  await invoke("print_thermal", {
    printer: options.printer ?? null,
    pngBase64,
    copies: options.copies ?? null,
  });
}

// Abre el diálogo de impresión nativo de Windows (elegir impresora, número
// de copias, orientación, o "Microsoft Print to PDF") sobre la ventana
// actual — en vez del viejo truco de un iframe oculto de tamaño 0, que
// podía saltarse el layout/paginado en algunos motores y quedarse pegado
// sin abrir nada. Se inyecta la foto en el propio documento y una hoja de
// estilo "@media print" oculta todo lo demás solo durante la impresión;
// fuera de eso, el elemento nunca se ve.
//
// La hoja sale a su tamaño físico real: la foto se compone a PRINT_DPI, así
// que sus píxeles ya dicen cuántos milímetros mide. Solo se encoge (sin
// deformarse) cuando el papel cargado es más chico que la hoja.
export function printViaSystemDialog(imageUrl: string): Promise<void> {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    container.id = "print-photo-container";
    const img = document.createElement("img");
    img.src = imageUrl;
    container.appendChild(img);
    document.body.appendChild(container);

    const style = document.createElement("style");
    // Oculto desde ya; las reglas de impresión se completan en applySize()
    // cuando la imagen cargó y se conoce su tamaño.
    style.textContent = "#print-photo-container { display: none; }";
    const applySize = () => {
      const widthMm = pxToMm(img.naturalWidth).toFixed(2);
      const aspect = (img.naturalWidth / img.naturalHeight).toFixed(4);
      style.textContent = `
      #print-photo-container { display: none; }
      /* Sin márgenes de página: si no, el motor de impresión encoge la
         hoja para dejarles lugar y las fotos ya no salen a su medida. */
      @page { margin: 0; }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          min-height: 0 !important;
        }
        body > *:not(#print-photo-container) { display: none !important; }
        #print-photo-container {
          display: block !important;
          position: static;
          width: 100%;
        }
        /* En impresión, 100vw/100vh = ancho/alto de la página: el tope
           evita que una hoja más grande que el papel se parta en dos. */
        #print-photo-container img {
          display: block;
          width: min(${widthMm}mm, 100vw, calc(99vh * ${aspect}));
          height: auto;
        }
      }
    `;
    };
    document.head.appendChild(style);

    let done = false;
    function cleanup() {
      if (done) return;
      done = true;
      window.removeEventListener("afterprint", cleanup);
      container.remove();
      style.remove();
      resolve();
    }
    window.addEventListener("afterprint", cleanup);
    // Salvavidas por si "afterprint" no dispara en algún build de WebView2.
    setTimeout(cleanup, 60_000);

    function triggerPrint() {
      // Un tick para que el navegador termine de pintar la imagen antes
      // de abrir el diálogo — si no, a veces sale la hoja en blanco.
      requestAnimationFrame(() => window.print());
    }
    function start() {
      applySize();
      triggerPrint();
    }
    if (img.complete) start();
    else img.onload = start;
  });
}

export async function printDefaultSilent(
  blob: Blob,
  options: PrintOptions = {},
): Promise<void> {
  const pngBase64 = await imageToPngBase64(blob);
  const mm = resolvePaperMm(
    options.paperSize ?? "auto",
    options.customWidthMm ?? null,
    options.customHeightMm ?? null,
  );
  await invoke("print_default_silent", {
    printer: options.printer ?? null,
    pngBase64,
    copies: options.copies ?? null,
    orientation: options.orientation ?? null,
    widthMm: mm?.widthMm ?? null,
    heightMm: mm?.heightMm ?? null,
  });
}

interface PrintDialogOutcome {
  printed: boolean;
  printer: string | null;
}

// Diálogo NATIVO de impresión de Windows (PrintDlgW — el común de todo el
// sistema, no el del navegador): deja elegir impresora y copias, y con esa
// elección el propio código dibuja la foto por GDI directo al tamaño de
// papel exacto pedido (cover-fit, sin bordes blancos) — a diferencia de
// window.print(), aquí el escalado/DPI lo controla nuestro código, no el
// motor de impresión del navegador.
export async function printWithNativeDialog(
  blob: Blob,
  options: PrintOptions = {},
): Promise<PrintDialogOutcome> {
  const pngBase64 = await imageToPngBase64(blob);
  const mm = resolvePaperMm(
    options.paperSize ?? "auto",
    options.customWidthMm ?? null,
    options.customHeightMm ?? null,
  );
  return invoke<PrintDialogOutcome>("print_with_native_dialog", {
    pngBase64,
    preferredPrinter: options.printer ?? null,
    orientation: options.orientation ?? null,
    widthMm: mm?.widthMm ?? null,
    heightMm: mm?.heightMm ?? null,
  });
}

export async function printImage(
  blob: Blob,
  options: PrintOptions = {},
): Promise<"thermal" | "dialog"> {
  // El diálogo nativo de Windows (PrintDlgW) daba control preciso de
  // tamaño de papel, pero a cambio: sin vista previa, el driver duplicando
  // copias por su cuenta, y "Microsoft Print to PDF" sin guardar nada sin
  // ayuda extra. Se regresa al diálogo del navegador (window.print()) —
  // como funcionaba originalmente — que resuelve los tres de una vez: trae
  // su propia vista previa, su propio control de copias, y su propio flujo
  // de "Guardar como PDF" que si funciona solo.
  if (isTauri) {
    // Las térmicas (recibo) no pasan por el pipeline de impresión de
    // Windows — se les manda ESC/POS crudo directo, así que el diálogo no
    // aplicaría aquí de ninguna forma útil.
    const printers = await listPrinters();
    const requested = options.printer
      ? printers.find((p) => p.name === options.printer)
      : undefined;
    const thermal = requested?.thermal
      ? requested
      : printers.find((p) => p.thermal);
    if (thermal) {
      // Rollo angosto y continuo: las dos copias siempre una sobre otra.
      const sheet = await buildDoubleSheet(blob, true);
      await printThermal(sheet, { ...options, printer: thermal.name });
      return "thermal";
    }
  }

  const sheet = await buildDoubleSheet(blob);
  const sheetUrl = URL.createObjectURL(sheet);
  try {
    await printViaSystemDialog(sheetUrl);
  } finally {
    setTimeout(() => URL.revokeObjectURL(sheetUrl), 1000);
  }
  return "dialog";
}
