import { Button } from "@photobooth/ui";
import { getTemplatesForFormat, type FrameTemplate } from "@/lib/frame-templates";
import type { PhotoFormat } from "@/lib/formats";

interface Props {
  format: PhotoFormat;
  onSelect: (frame: FrameTemplate) => void;
  onSkip: () => void;
}

export function FrameSelectionScreen({ format, onSelect, onSkip }: Props) {
  const templates = getTemplatesForFormat(format.id);

  if (templates.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-6">
        <p className="text-muted-foreground">No hay marcos disponibles para este formato.</p>
        <Button size="lg" onClick={onSkip}>
          Continuar sin marco
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Elige un marco</h1>
        <p className="mt-2 text-muted-foreground">
          Selecciona el estilo de marco para tu {format.name}
        </p>
      </div>

      <div className="flex gap-6 flex-wrap justify-center max-w-4xl">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => onSelect(tpl)}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:border-[#22d3ee]/40 hover:bg-[#22d3ee]/5 hover:scale-105"
          >
            <div
              className="rounded-lg border-2 border-dashed border-white/20 group-hover:border-[#22d3ee]/40 flex items-center justify-center transition-colors overflow-hidden"
              style={{
                width: Math.min(tpl.canvasSize.width * 0.3, 180),
                height: Math.min(tpl.canvasSize.height * 0.3, 180),
              }}
            >
              <div className="flex flex-col items-center gap-1 p-2">
                {tpl.photoSlots.map((_, i) => (
                  <div
                    key={i}
                    className="w-full rounded bg-white/10"
                    style={{ height: 20 }}
                  />
                ))}
              </div>
            </div>
            <h3 className="text-sm font-medium text-foreground">{tpl.name}</h3>
          </button>
        ))}
      </div>

      <Button variant="secondary" size="lg" onClick={onSkip}>
        Sin marco
      </Button>
    </div>
  );
}
