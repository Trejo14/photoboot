import { invoke, isTauri } from "./tauri";
import type { PrintOrientation, PrintPaperSize } from "./settings";
import { resolvePaperMm } from "./paper-sizes";

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
export function printViaSystemDialog(imageUrl: string): Promise<void> {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    container.id = "print-photo-container";
    const img = document.createElement("img");
    img.src = imageUrl;
    container.appendChild(img);
    document.body.appendChild(container);

    const style = document.createElement("style");
    style.textContent = `
      #print-photo-container { display: none; }
      @media print {
        body > *:not(#print-photo-container) { display: none !important; }
        #print-photo-container {
          display: block !important;
          position: static;
          width: 100%;
        }
        #print-photo-container img { width: 100%; height: auto; }
      }
    `;
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
    if (img.complete) triggerPrint();
    else img.onload = triggerPrint;
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
  imageUrl: string,
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
      await printThermal(blob, { ...options, printer: thermal.name });
      return "thermal";
    }
  }

  await printViaSystemDialog(imageUrl);
  return "dialog";
}
