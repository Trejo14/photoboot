import { Button } from "@photobooth/ui";
import { PHOTO_FORMATS, type PhotoFormat } from "@/lib/formats";

interface Props {
  onSelect: (format: PhotoFormat) => void;
  onBack: () => void;
}

export function FormatSelectionScreen({ onSelect, onBack }: Props) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Elige tu foto</h1>
        <p className="mt-2 text-muted-foreground">
          Selecciona cuántas fotos quieres en tu sesión
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-3xl w-full">
        {PHOTO_FORMATS.map((format) => (
          <button
            key={format.id}
            onClick={() => onSelect(format)}
            className="group flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:border-[#22d3ee]/40 hover:bg-[#22d3ee]/5 hover:scale-105"
          >
            <div className="flex flex-col items-center gap-1">
              {Array.from({ length: format.photoCount }).map((_, i) => (
                <div
                  key={i}
                  className="w-24 h-16 rounded-lg border-2 border-dashed border-white/20 group-hover:border-[#22d3ee]/40 flex items-center justify-center transition-colors"
                >
                  <span className="text-xs text-white/30 group-hover:text-[#22d3ee]/60">
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground">
                {format.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {format.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      <Button variant="secondary" size="lg" onClick={onBack}>
        Volver
      </Button>
    </div>
  );
}
