import type { PrintPaperSize } from "./settings";

const MM_PER_INCH = 25.4;
const inches = (w: number, h: number) => ({
  widthMm: Math.round(w * MM_PER_INCH * 100) / 100,
  heightMm: Math.round(h * MM_PER_INCH * 100) / 100,
});

export interface PaperPreset {
  label: string;
  widthMm: number;
  heightMm: number;
}

// Fuente única de la tabla de tamaños — el lado Rust solo recibe
// milímetros ya resueltos, no conoce los nombres de los presets.
export const PAPER_SIZE_PRESETS: Record<
  Exclude<PrintPaperSize, "auto" | "custom">,
  PaperPreset
> = {
  "strip-2x6": { label: "Tira de fotos (2 x 6 in)", ...inches(2, 6) },
  "4x6": { label: "Estándar 4R (4 x 6 in)", ...inches(4, 6) },
  "polaroid-2.6x4": {
    label: "Polaroid / crédito (2.6 x 4 in)",
    ...inches(2.6, 4),
  },
  "square-4x4": { label: "Cuadrado (4 x 4 in)", ...inches(4, 4) },
  "5x7": { label: "Grande (5 x 7 in)", ...inches(5, 7) },
  "6x8": { label: "Grande (6 x 8 in)", ...inches(6, 8) },
  carta: { label: "Carta", ...inches(8.5, 11) },
  a4: { label: "A4", widthMm: 210, heightMm: 297 },
};

export const PAPER_SIZE_OPTIONS: { value: PrintPaperSize; label: string }[] = [
  { value: "auto", label: "Como esté configurada la impresora" },
  ...(
    Object.keys(PAPER_SIZE_PRESETS) as Exclude<
      PrintPaperSize,
      "auto" | "custom"
    >[]
  ).map((value) => ({ value, label: PAPER_SIZE_PRESETS[value].label })),
  { value: "custom", label: "Personalizado…" },
];

/** Resuelve un PrintPaperSize a milímetros, o `null` si no aplica ("auto",
 * o "custom" sin medidas válidas todavía). */
export function resolvePaperMm(
  paperSize: PrintPaperSize,
  customWidthMm: number | null,
  customHeightMm: number | null,
): { widthMm: number; heightMm: number } | null {
  if (paperSize === "auto") return null;
  if (paperSize === "custom") {
    if (
      customWidthMm &&
      customHeightMm &&
      customWidthMm > 0 &&
      customHeightMm > 0
    ) {
      return { widthMm: customWidthMm, heightMm: customHeightMm };
    }
    return null;
  }
  const preset = PAPER_SIZE_PRESETS[paperSize];
  return preset ? { widthMm: preset.widthMm, heightMm: preset.heightMm } : null;
}
