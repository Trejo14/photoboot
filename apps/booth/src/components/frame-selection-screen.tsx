import { Button } from "@photobooth/ui";
import {
  getTemplatesForFormat,
  type FrameTemplate,
} from "@/lib/frame-templates";
import type { PhotoFormat } from "@/lib/formats";
import type { LicenseInfo } from "@/lib/license";
import { getEffectivePlan, canUseFrames } from "@/lib/plan";
import { LockIcon } from "./icons";

interface Props {
  format: PhotoFormat;
  license: LicenseInfo | undefined;
  onSelect: (frame: FrameTemplate) => void;
  onSkip: () => void;
  onOpenLicense: () => void;
}

export function FrameSelectionScreen({
  format,
  license,
  onSelect,
  onSkip,
  onOpenLicense,
}: Props) {
  const templates = getTemplatesForFormat(format.id);
  const plan = getEffectivePlan(license);
  const locked = !canUseFrames(plan);

  if (templates.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-6">
        <p className="text-muted-foreground">
          No hay marcos disponibles para este formato.
        </p>
        <Button size="lg" onClick={onSkip}>
          Continuar sin marco
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center gap-8 overflow-y-auto bg-background p-6 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Elige un marco</h1>
        <p className="mt-2 text-muted-foreground">
          Selecciona el estilo de marco para tu {format.name}
        </p>
      </div>

      {locked && (
        <div className="flex max-w-xl flex-col items-center gap-3 rounded-2xl border border-[#a78bfa]/30 bg-[#a78bfa]/5 p-5 text-center">
          <p className="text-sm text-foreground">
            Los marcos son una función{" "}
            <span className="font-semibold text-[#a78bfa]">PRO</span>. Estás en
            modo de prueba: puedes tomar fotos sin marco. Activa tu código de
            licencia para desbloquearlos.
          </p>
          <Button
            size="sm"
            onClick={onOpenLicense}
            className="gradient-birdcam"
          >
            Activar licencia
          </Button>
        </div>
      )}

      <div className="flex gap-6 flex-wrap justify-center max-w-4xl">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => (locked ? onOpenLicense() : onSelect(tpl))}
            className={`group relative flex flex-col items-center gap-3 rounded-2xl border p-4 transition-all ${
              locked
                ? "border-white/10 bg-white/[0.02] opacity-60"
                : "border-white/10 bg-white/5 hover:border-[#22d3ee]/40 hover:bg-[#22d3ee]/5 hover:scale-105"
            }`}
          >
            {locked && (
              <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white/80">
                <LockIcon className="size-3.5" />
              </span>
            )}
            <div
              className="rounded-lg border-2 border-dashed border-white/20 group-hover:border-[#22d3ee]/40 flex items-center justify-center transition-colors overflow-hidden bg-black/20"
              style={{
                width: Math.min(tpl.canvasSize.width * 0.3, 180),
                height: Math.min(tpl.canvasSize.height * 0.3, 180),
              }}
            >
              <img
                src={tpl.backgroundImageUrl}
                alt=""
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </div>
            <h3 className="text-sm font-medium text-foreground">{tpl.name}</h3>
          </button>
        ))}
      </div>

      <Button variant="secondary" size="lg" onClick={onSkip}>
        {locked ? "Continuar en modo de prueba (sin marco)" : "Sin marco"}
      </Button>
    </div>
  );
}
