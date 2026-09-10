import { invoke, isTauri } from "./tauri";
import type { PrintOrientation, PrintPaperSize } from "./settings";

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

// Usado solo como opción manual del operador (panel de impresión) o en modo
// dev sin Tauri. Un iframe de tamaño 0 puede saltarse el layout/paginado en
// algunos motores, así que se le da un tamaño real y solo se oculta
// posicionándolo fuera de pantalla.
export function printViaSystemDialog(imageUrl: string): void {
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.left = "-10000px";
  frame.style.top = "0";
  frame.style.width = "800px";
  frame.style.height = "600px";
  frame.style.border = "0";
  frame.srcdoc =
    "<html><head><style>" +
    "html,body{margin:0}img{display:block;width:100%;max-width:800px;margin:0 auto}" +
    '</style></head><body><img src="' +
    imageUrl +
    '" onload="setTimeout(function(){window.focus();window.print();},200)"/></body></html>';
  document.body.appendChild(frame);
  setTimeout(() => frame.remove(), 60000);
}

export async function printDefaultSilent(
  blob: Blob,
  options: PrintOptions = {},
): Promise<void> {
  const pngBase64 = await imageToPngBase64(blob);
  await invoke("print_default_silent", {
    printer: options.printer ?? null,
    pngBase64,
    copies: options.copies ?? null,
    orientation: options.orientation ?? null,
    paperSize: options.paperSize ?? null,
  });
}

export async function printImage(
  blob: Blob,
  imageUrl: string,
  options: PrintOptions = {},
): Promise<"thermal" | "silent" | "dialog"> {
  if (!isTauri) {
    printViaSystemDialog(imageUrl);
    return "dialog";
  }

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

  // Impresora normal (no térmica): imprime directo por GDI sin mostrar el
  // diálogo de Windows, para que los invitados no lo vean. Ya no hay un
  // reintento silencioso oculto aquí si esto falla — el error sube tal
  // cual para que la pantalla de "Imprimiendo" lo muestre con opción de
  // reintentar, en vez de fallar sin que nadie se entere.
  await printDefaultSilent(blob, options);
  return "silent";
}
