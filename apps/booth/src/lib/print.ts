import { invoke, isTauri } from "./tauri";

export interface PrinterInfo {
  name: string;
  driver: string;
  port: string;
  thermal: boolean;
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
            reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
            reader.readAsDataURL(b);
          },
          "image/png",
          1
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
  printer?: string
): Promise<void> {
  const pngBase64 = await imageToPngBase64(blob);
  await invoke("print_thermal", { printer: printer ?? null, pngBase64 });
}

export function printViaSystemDialog(imageUrl: string): void {
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  frame.srcdoc =
    "<html><head><style>" +
    "html,body{margin:0}img{display:block;width:100%;max-width:800px;margin:0 auto}" +
    "</style></head><body><img src=\"" +
    imageUrl +
    "\" onload=\"setTimeout(function(){window.focus();window.print();},200)\"/></body></html>";
  document.body.appendChild(frame);
  setTimeout(() => frame.remove(), 60000);
}

export async function printDefaultSilent(
  blob: Blob,
  printer?: string
): Promise<void> {
  const pngBase64 = await imageToPngBase64(blob);
  await invoke("print_default_silent", { printer: printer ?? null, pngBase64 });
}

export async function printImage(
  blob: Blob,
  imageUrl: string
): Promise<"thermal" | "silent" | "dialog"> {
  if (isTauri) {
    const printers = await listPrinters();
    const thermal = printers.find((p) => p.thermal);
    if (thermal) {
      await printThermal(blob, thermal.name);
      return "thermal";
    }
    // Impresora normal (no térmica): imprime directo por GDI sin mostrar
    // el diálogo de Windows, para que los invitados no lo vean. Si falla
    // (driver raro, sin impresora predeterminada), cae al diálogo visible
    // como último recurso para no perder la impresión.
    try {
      await printDefaultSilent(blob);
      return "silent";
    } catch {
      // sigue al fallback de abajo
    }
  }
  printViaSystemDialog(imageUrl);
  return "dialog";
}