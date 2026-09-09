export interface PhotoSlot {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface QrSlot {
  x: number;
  y: number;
  size: number;
}

import { GENERATED_FRAME_TEMPLATES } from "./frame-templates.generated";

export interface FrameTemplate {
  id: string;
  name: string;
  compatibleFormatId: string;
  backgroundImageUrl: string;
  photoSlots: PhotoSlot[];
  qrSlot: QrSlot;
  canvasSize: { width: number; height: number };
}

export const FRAME_TEMPLATES: FrameTemplate[] = [
  {
    id: "single-classic",
    name: "Clásico",
    compatibleFormatId: "single",
    backgroundImageUrl: "/frames/single-classic.svg",
    photoSlots: [{ x: 40, y: 40, width: 520, height: 420 }],
    qrSlot: { x: 600, y: 340, size: 100 },
    canvasSize: { width: 600, height: 500 },
  },
  {
    id: "strip-2-vertical",
    name: "Tira de 2",
    compatibleFormatId: "strip-2",
    backgroundImageUrl: "/frames/strip-2-vertical.svg",
    photoSlots: [
      { x: 40, y: 40, width: 520, height: 200 },
      { x: 40, y: 260, width: 520, height: 200 },
    ],
    qrSlot: { x: 460, y: 480, size: 80 },
    canvasSize: { width: 600, height: 580 },
  },
  {
    id: "strip-3-vertical",
    name: "Tira de 3",
    compatibleFormatId: "strip-3",
    backgroundImageUrl: "/frames/strip-3-vertical.svg",
    photoSlots: [
      { x: 40, y: 40, width: 520, height: 160 },
      { x: 40, y: 220, width: 520, height: 160 },
      { x: 40, y: 400, width: 520, height: 160 },
    ],
    qrSlot: { x: 460, y: 580, size: 80 },
    canvasSize: { width: 600, height: 680 },
  },
  ...GENERATED_FRAME_TEMPLATES,
];

export function getTemplatesForFormat(formatId: string): FrameTemplate[] {
  return FRAME_TEMPLATES.filter((t) => t.compatibleFormatId === formatId);
}

export function getTemplateById(id: string): FrameTemplate | undefined {
  return FRAME_TEMPLATES.find((t) => t.id === id);
}
