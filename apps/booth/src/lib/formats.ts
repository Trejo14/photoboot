export interface PhotoFormat {
  id: "single" | "strip-2" | "strip-3" | "grid-4";
  name: string;
  description: string;
  photoCount: number;
  layout: "single" | "vertical-strip" | "grid";
  thumbnail: string;
}

export const PHOTO_FORMATS: PhotoFormat[] = [
  {
    id: "single",
    name: "1 Foto",
    description: "Una foto clásica con marco",
    photoCount: 1,
    layout: "single",
    thumbnail: "1",
  },
  {
    id: "strip-2",
    name: "Tira de 2",
    description: "Dos fotos apiladas verticalmente",
    photoCount: 2,
    layout: "vertical-strip",
    thumbnail: "2",
  },
  {
    id: "strip-3",
    name: "Tira de 3",
    description: "El clásico photobooth — 3 fotos en tira vertical",
    photoCount: 3,
    layout: "vertical-strip",
    thumbnail: "3",
  },
  {
    id: "grid-4",
    name: "4 Fotos",
    description: "Cuatro fotos en cuadrícula",
    photoCount: 4,
    layout: "grid",
    thumbnail: "4",
  },
];

export function getFormatById(id: string): PhotoFormat | undefined {
  return PHOTO_FORMATS.find((f) => f.id === id);
}
