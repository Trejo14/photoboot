export interface PhotoFormat {
  id: "single" | "strip-2" | "strip-3" | "grid-4";
  name: string;
  description: string;
  photoCount: number;
  layout: "single" | "vertical-strip" | "grid";
  thumbnail: string;
  // Medida final de UNA copia impresa, en milímetros (ancho x alto).
  printSizeMm: { widthMm: number; heightMm: number };
}

// Resolución a la que se compone la foto final. La impresión deduce el
// tamaño físico a partir de los píxeles con este mismo valor, así que
// ambos lados tienen que usar la misma constante.
export const PRINT_DPI = 300;
const MM_PER_INCH = 25.4;

export function mmToPx(mm: number): number {
  return Math.round((mm / MM_PER_INCH) * PRINT_DPI);
}

export function pxToMm(px: number): number {
  return (px / PRINT_DPI) * MM_PER_INCH;
}

/** Tamaño en píxeles del lienzo final de un formato (a PRINT_DPI). */
export function getFormatCanvasSize(format: PhotoFormat): {
  width: number;
  height: number;
} {
  return {
    width: mmToPx(format.printSizeMm.widthMm),
    height: mmToPx(format.printSizeMm.heightMm),
  };
}

export const PHOTO_FORMATS: PhotoFormat[] = [
  {
    id: "single",
    name: "1 Foto",
    description: "Una foto clásica con marco",
    photoCount: 1,
    layout: "single",
    thumbnail: "1",
    printSizeMm: { widthMm: 143, heightMm: 100 },
  },
  {
    id: "strip-2",
    name: "Tira de 2",
    description: "Dos fotos apiladas verticalmente",
    photoCount: 2,
    layout: "vertical-strip",
    thumbnail: "2",
    printSizeMm: { widthMm: 65, heightMm: 120 },
  },
  {
    id: "strip-3",
    name: "Tira de 3",
    description: "El clásico photobooth — 3 fotos en tira vertical",
    photoCount: 3,
    layout: "vertical-strip",
    thumbnail: "3",
    printSizeMm: { widthMm: 50, heightMm: 150 },
  },
  {
    id: "grid-4",
    name: "4 Fotos",
    description: "Cuatro fotos en cuadrícula",
    photoCount: 4,
    layout: "grid",
    thumbnail: "4",
    printSizeMm: { widthMm: 145, heightMm: 100 },
  },
];

export function getFormatByPhotoCount(count: number): PhotoFormat | undefined {
  return PHOTO_FORMATS.find((f) => f.photoCount === count);
}

export function getFormatById(id: string): PhotoFormat | undefined {
  return PHOTO_FORMATS.find((f) => f.id === id);
}
