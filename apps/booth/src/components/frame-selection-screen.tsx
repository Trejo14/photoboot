import { useEffect, useRef, useState } from "react";
import { Button } from "@photobooth/ui";
import {
  getTemplatesForFormat,
  type FrameTemplate,
} from "@/lib/frame-templates";
import {
  getFormatCanvasSize,
  PRINT_DPI,
  type PhotoFormat,
} from "@/lib/formats";
import type { LicenseInfo } from "@/lib/license";
import { getEffectivePlan, canUseFrames } from "@/lib/plan";
import {
  addCustomFrame,
  deleteCustomFrame,
  getCustomFrames,
  getFrameSource,
  processCustomFrameImage,
  setFrameSource,
  FrameDetectionError,
  type FrameSource,
} from "@/lib/custom-frames";
import { LockIcon, TrashIcon } from "./icons";

interface Props {
  format: PhotoFormat;
  license: LicenseInfo | undefined;
  email: string | null;
  onSelect: (frame: FrameTemplate) => void;
  onSkip: () => void;
  onOpenLicense: () => void;
}

export function FrameSelectionScreen({
  format,
  license,
  email,
  onSelect,
  onSkip,
  onOpenLicense,
}: Props) {
  const systemTemplates = getTemplatesForFormat(format.id);
  const plan = getEffectivePlan(license);
  const locked = !canUseFrames(plan);

  const [source, setSource] = useState<FrameSource>("system");
  const [customFrames, setCustomFrames] = useState<FrameTemplate[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void getFrameSource(email).then(setSource);
    void getCustomFrames(email).then((all) =>
      setCustomFrames(all.filter((f) => f.compatibleFormatId === format.id)),
    );
  }, [email, format.id]);

  async function handleChangeSource(next: FrameSource) {
    setSource(next);
    await setFrameSource(email, next);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setUploadNotice(null);
    try {
      const { template, format: detected } = await processCustomFrameImage(
        file,
        { name: file.name.replace(/\.\w+$/, ""), preferredFormat: format },
      );
      await addCustomFrame(email, template);
      if (detected.id === format.id) {
        setCustomFrames((prev) => [...prev, template]);
      } else {
        // El diseño manda: se guarda en el formato que corresponde a sus
        // huecos, aunque no sea el que está abierto ahora.
        setUploadNotice(
          `El diseño tiene ${detected.photoCount} ${
            detected.photoCount === 1 ? "hueco" : "huecos"
          } para fotos, así que se guardó en el formato "${detected.name}". Lo verás al elegir ese formato.`,
        );
      }
    } catch (err) {
      setUploadError(
        err instanceof FrameDetectionError
          ? err.message
          : "No se pudo procesar la imagen. Verifica que sea un PNG válido.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(frameId: string) {
    await deleteCustomFrame(email, frameId);
    setCustomFrames((prev) => prev.filter((f) => f.id !== frameId));
  }

  const templates = source === "system" ? systemTemplates : customFrames;
  const { printSizeMm } = format;
  const recommendedPx = getFormatCanvasSize(format);

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

      <div className="flex rounded-lg bg-muted p-0.5">
        <button
          type="button"
          onClick={() => void handleChangeSource("system")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            source === "system"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Marcos del sistema
        </button>
        <button
          type="button"
          onClick={() => void handleChangeSource("custom")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            source === "custom"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Mis marcos ({customFrames.length})
        </button>
      </div>

      {source === "custom" && (
        <div className="flex flex-col items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png"
            className="hidden"
            onChange={(e) => void handleUpload(e)}
          />
          <Button
            variant="secondary"
            onClick={() =>
              locked ? onOpenLicense() : fileInputRef.current?.click()
            }
            disabled={uploading}
          >
            {uploading ? "Procesando…" : "Subir marco (PNG)"}
          </Button>
          <p className="max-w-md text-center text-xs text-muted-foreground">
            Deja transparente (o en blanco sólido) cada zona donde va una
            foto: el sistema detecta esos huecos automáticamente y acomoda
            las fotos ahí. Para {format.name} el diseño debe medir{" "}
            {printSizeMm.widthMm / 10} cm de ancho x {printSizeMm.heightMm / 10}{" "}
            cm de largo ({recommendedPx.width} x {recommendedPx.height} px a{" "}
            {PRINT_DPI} dpi).
          </p>
          {uploadNotice && (
            <p className="max-w-md text-center text-xs text-[#22d3ee]">
              {uploadNotice}
            </p>
          )}
          {uploadError && (
            <p className="max-w-md text-center text-xs text-destructive">
              {uploadError}
            </p>
          )}
        </div>
      )}

      {templates.length === 0 ? (
        <p className="text-muted-foreground">
          {source === "system"
            ? "No hay marcos del sistema para este formato."
            : "Todavía no subes ningún marco para este formato."}
        </p>
      ) : (
        <div className="flex gap-6 flex-wrap justify-center max-w-4xl">
          {templates.map((tpl) => (
            <div key={tpl.id} className="relative">
              <button
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
                <h3 className="text-sm font-medium text-foreground">
                  {tpl.name}
                </h3>
              </button>
              {source === "custom" && (
                <button
                  onClick={() => void handleDelete(tpl.id)}
                  aria-label="Eliminar marco"
                  title="Eliminar marco"
                  className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white/60 hover:border-red-500/40 hover:text-red-400"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Button variant="secondary" size="lg" onClick={onSkip}>
        {locked ? "Continuar en modo de prueba (sin marco)" : "Sin marco"}
      </Button>
    </div>
  );
}
