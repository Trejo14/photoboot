import { useEffect, useState } from "react";
import { Button, Input } from "@photobooth/ui";
import { listPrinters, printImage, type PrinterInfo } from "@/lib/print";
import { PAPER_SIZE_OPTIONS } from "@/lib/paper-sizes";
import { errorMessage } from "@/lib/errors";
import type { Settings } from "@/lib/settings";

interface LastPhoto {
  blob: Blob;
  imageUrl: string;
}

interface Props {
  settings: Settings;
  onSettingsChange: (patch: Partial<Settings>) => void;
  lastPhoto: LastPhoto | null;
  onBack: () => void;
}

// Panel de operador: qué impresora usar, orientación, tamaño de papel y
// copias — separado del flujo del invitado, y con vista previa explícita
// antes de mandar a imprimir (a diferencia del auto-print del flujo normal,
// que no pide confirmación).
export function PrintSettingsPanel({
  settings,
  onSettingsChange,
  lastPhoto,
  onBack,
}: Props) {
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [loadingPrinters, setLoadingPrinters] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listPrinters()
      .then((list) => {
        if (!cancelled) setPrinters(list);
      })
      .finally(() => {
        if (!cancelled) setLoadingPrinters(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleTestPrint() {
    if (!lastPhoto || printing) return;
    setPrinting(true);
    setResult(null);
    try {
      const mode = await printImage(lastPhoto.blob, {
        printer: settings.printerName,
        copies: settings.printCopies,
        orientation: settings.printOrientation,
        paperSize: settings.printPaperSize,
        customWidthMm: settings.customPaperWidthMm,
        customHeightMm: settings.customPaperHeightMm,
      });
      setResult(
        mode === "thermal"
          ? "Enviado a la impresora térmica."
          : "Impreso correctamente.",
      );
    } catch (err) {
      setResult(`Error: ${errorMessage(err, "Error al imprimir")}`);
    } finally {
      setPrinting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Impresora</label>
        <select
          value={settings.printerName ?? ""}
          onChange={(e) =>
            onSettingsChange({ printerName: e.target.value || null })
          }
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          disabled={loadingPrinters}
        >
          <option value="">
            Automática (térmica si hay, si no la predeterminada)
          </option>
          {printers.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
              {p.thermal ? " (térmica)" : ""}
            </option>
          ))}
        </select>
        {!loadingPrinters && printers.length === 0 && (
          <p className="text-xs text-amber-400/80">
            No se detectaron impresoras instaladas en Windows.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Orientación</label>
          <select
            value={settings.printOrientation}
            onChange={(e) =>
              onSettingsChange({
                printOrientation: e.target
                  .value as Settings["printOrientation"],
              })
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="portrait">Vertical</option>
            <option value="landscape">Horizontal</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tamaño de papel</label>
          <select
            value={settings.printPaperSize}
            onChange={(e) =>
              onSettingsChange({
                printPaperSize: e.target.value as Settings["printPaperSize"],
              })
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {PAPER_SIZE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {settings.printPaperSize === "custom" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Ancho (mm)</label>
            <Input
              type="number"
              min={1}
              step={0.1}
              value={settings.customPaperWidthMm ?? ""}
              onChange={(e) =>
                onSettingsChange({
                  customPaperWidthMm: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Alto (mm)</label>
            <Input
              type="number"
              min={1}
              step={0.1}
              value={settings.customPaperHeightMm ?? ""}
              onChange={(e) =>
                onSettingsChange({
                  customPaperHeightMm: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Copias por impresión ({settings.printCopies})
        </label>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={settings.printCopies}
          onChange={(e) =>
            onSettingsChange({ printCopies: Number(e.target.value) })
          }
          className="w-full"
        />
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        <p className="mb-2 text-xs font-medium text-white/60">
          Vista previa (última foto de esta sesión)
        </p>
        {lastPhoto ? (
          <div className="space-y-3">
            <img
              src={lastPhoto.imageUrl}
              alt="Vista previa"
              className="mx-auto max-h-48 rounded-md object-contain"
            />
            <Button
              className="w-full"
              onClick={() => void handleTestPrint()}
              disabled={printing}
            >
              {printing ? "Imprimiendo…" : "Imprimir con estos ajustes"}
            </Button>
            {result && (
              <p className="text-center text-xs text-white/70">{result}</p>
            )}
          </div>
        ) : (
          <p className="text-center text-xs text-white/40">
            No hay ninguna foto de esta sesión todavía. Estos ajustes se aplican
            a la siguiente impresión automática del flujo normal.
          </p>
        )}
      </div>

      <Button variant="secondary" className="w-full" onClick={onBack}>
        Volver
      </Button>
    </div>
  );
}
