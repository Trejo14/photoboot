import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Input } from "@photobooth/ui";
import { LogoBirdcam } from "./logo";
import {
  CameraIcon,
  PrinterIcon,
  WifiIcon,
  CheckCircleIcon,
  WifiOffIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "./icons";
import { invoke, isTauri } from "@/lib/tauri";
import { setAdminPin } from "@/lib/auth";
import { getSettings, saveSettings, type Settings } from "@/lib/settings";

interface Props {
  onComplete: () => void;
}

interface CameraDevice {
  deviceId: string;
  label: string;
}

interface PrinterDevice {
  name: string;
  driver: string;
  port: string;
  thermal: boolean;
}

const TOTAL_STEPS = 5;

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current
              ? "w-8 gradient-birdcam"
              : i < current
                ? "w-4 bg-white/40"
                : "w-4 bg-white/15"
          }`}
        />
      ))}
    </div>
  );
}

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center gap-8 animate-fade-in">
      <LogoBirdcam size="24" className="text-white animate-pulse-glow" />
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-bold text-white">¡Bienvenido a Birdcam!</h1>
        <p className="text-lg text-white/60">
          Vamos a configurar tu cabina en unos minutos.
        </p>
      </div>
      <Button onClick={onNext} className="gradient-birdcam px-10 text-base font-semibold">
        Comenzar
      </Button>
    </div>
  );
}

function StepCamera({
  cameras,
  selectedId,
  onSelect,
  videoRef,
  hasPermission,
}: {
  cameras: CameraDevice[];
  selectedId: string;
  onSelect: (id: string) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  hasPermission: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-6 animate-slide-in-right w-full max-w-md">
      <div className="flex items-center gap-3">
        <CameraIcon className="h-6 w-6 text-white" />
        <h2 className="text-2xl font-bold text-white">Configurar cámara</h2>
      </div>

      <div className="relative w-full aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="h-full w-full -scale-x-100 object-cover"
        />
        {hasPermission && (
          <div className="absolute top-3 right-3">
            <CheckCircleIcon className="h-6 w-6 text-green-400" />
          </div>
        )}
        {!hasPermission && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center space-y-2">
              <CameraIcon className="h-12 w-12 text-white/40 mx-auto" />
              <p className="text-sm text-white/50">Solicitando permiso de cámara…</p>
            </div>
          </div>
        )}
      </div>

      {cameras.length > 1 && (
        <div className="w-full space-y-1.5">
          <label className="text-sm font-medium text-white/70">Seleccionar cámara</label>
          <select
            value={selectedId}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white"
          >
            <option value="">Automática</option>
            {cameras.map((c) => (
              <option key={c.deviceId} value={c.deviceId}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function StepPrinter({
  printers,
  selectedPrinter,
  onSelect,
  onSkip,
}: {
  printers: PrinterDevice[];
  selectedPrinter: string;
  onSelect: (name: string) => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 animate-slide-in-right w-full max-w-md">
      <div className="flex items-center gap-3">
        <PrinterIcon className="h-6 w-6 text-white" />
        <h2 className="text-2xl font-bold text-white">Configurar impresora</h2>
      </div>

      {printers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-8">
          <PrinterIcon className="h-12 w-12 text-white/30" />
          <p className="text-center text-sm text-white/50">
            No se detectaron impresoras conectadas.
            <br />
            Puedes configurarla más tarde.
          </p>
        </div>
      ) : (
        <div className="w-full space-y-2">
          {printers.map((p) => (
            <button
              key={p.name}
              onClick={() => onSelect(p.name)}
              className={`w-full rounded-lg border p-3 text-left transition-all ${
                selectedPrinter === p.name
                  ? "border-[#a78bfa]/50 bg-[#a78bfa]/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-white/40">{p.driver}</p>
                </div>
                {p.thermal && (
                  <span className="rounded-full bg-[#22d3ee]/20 px-2 py-0.5 text-xs text-[#22d3ee]">
                    Térmica
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <button onClick={onSkip} className="text-sm text-white/40 hover:text-white/60 transition-colors">
        Configurar después
      </button>
    </div>
  );
}

function StepInternet({ isOnline }: { isOnline: boolean }) {
  return (
    <div className="flex flex-col items-center gap-6 animate-slide-in-right">
      <div className="flex items-center gap-3">
        <WifiIcon className="h-6 w-6 text-white" />
        <h2 className="text-2xl font-bold text-white">Conexión a internet</h2>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-10">
        {isOnline ? (
          <>
            <CheckCircleIcon className="h-16 w-16 text-green-400" />
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-white">Conectado</p>
              <p className="text-sm text-white/50">
                Birdcam está conectado a internet y listo para sincronizar fotos.
              </p>
            </div>
          </>
        ) : (
          <>
            <WifiOffIcon className="h-16 w-16 text-amber-400" />
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-white">Sin conexión</p>
              <p className="text-sm text-white/50">
                Puedes usar Birdcam sin internet. Las fotos se sincronizarán cuando se restaure la conexión.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StepPin({ onSet }: { onSet: (pin: string) => void }) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pin.length < 4) {
      setError("El PIN debe tener al menos 4 dígitos");
      return;
    }
    if (pin !== confirm) {
      setError("Los PINs no coinciden");
      return;
    }
    setError(null);
    onSet(pin);
  }

  const isValid = pin.length >= 4 && pin === confirm;

  return (
    <div className="flex flex-col items-center gap-6 animate-slide-in-right w-full max-w-sm">
      <div className="flex items-center gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <h2 className="text-2xl font-bold text-white">PIN de administrador</h2>
      </div>

      <p className="text-center text-sm text-white/50">
        Usarás este PIN para acceder a la configuración y cerrar la app.
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/70">Crear PIN (4-6 dígitos)</label>
          <Input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            className="text-center text-lg tracking-[0.5em]"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/70">Confirmar PIN</label>
          <Input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            className="text-center text-lg tracking-[0.5em]"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          className="w-full gradient-birdcam text-base font-semibold"
          disabled={!isValid}
        >
          Guardar y continuar
        </Button>
      </form>
    </div>
  );
}

export function WelcomeWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [settings, setSettingsState] = useState<Settings | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    void getSettings().then(setSettingsState);
  }, []);

  // Enumerate cameras
  useEffect(() => {
    void navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const cams = devices
          .filter((d) => d.kind === "videoinput")
          .map((d) => ({ deviceId: d.deviceId, label: d.label || "Cámara" }));
        setCameras(cams);
      })
      .catch(() => undefined);
  }, []);

  // Start camera preview when reaching step 1
  useEffect(() => {
    if (step !== 1) return;
    let stream: MediaStream | null = null;
    let cancelled = false;

    void (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch {
        setHasCameraPermission(false);
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [step, videoRef]);

  // Stop camera when leaving step 1
  useEffect(() => {
    if (step === 1) return;
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  }, [step, videoRef]);

  // Enumerate printers when reaching step 2
  useEffect(() => {
    if (step !== 2 || !isTauri) return;
    void invoke<{ name: string; driver: string; port: string; thermal: boolean }[]>(
      "list_printers"
    )
      .then(setPrinters)
      .catch(() => setPrinters([]));
  }, [step]);

  // Online/offline listener
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const goNext = useCallback(() => {
    setDirection("forward");
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  const goBack = useCallback(() => {
    setDirection("backward");
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const handlePinSet = useCallback(
    async (pin: string) => {
      await setAdminPin(pin);
      if (settings) {
        await saveSettings({ ...settings, adminPin: pin });
      }
      onComplete();
    },
    [settings, onComplete]
  );

  const handleCameraSelect = useCallback(
    (deviceId: string) => {
      setSelectedCamera(deviceId);
      if (settings) {
        void saveSettings({ ...settings, cameraDeviceId: deviceId || null });
      }
    },
    [settings]
  );

  const handlePrinterSelect = useCallback(
    (name: string) => {
      setSelectedPrinter(name);
      if (settings) {
        void saveSettings({ ...settings, printerName: name });
      }
    },
    [settings]
  );

  const handleSkipPrinter = useCallback(() => {
    setSelectedPrinter("");
    if (settings) {
      void saveSettings({ ...settings, printerName: null });
    }
    goNext();
  }, [settings, goNext]);

  const animClass = direction === "forward" ? "animate-slide-in-right" : "animate-slide-in-left";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-black p-4">
      <div className="flex w-full max-w-lg flex-col items-center gap-10">
        <StepIndicator current={step} />

        <div className={`w-full ${animClass}`} key={`${step}-${direction}`}>
          {step === 0 && <StepWelcome onNext={goNext} />}
          {step === 1 && (
            <StepCamera
              cameras={cameras}
              selectedId={selectedCamera}
              onSelect={handleCameraSelect}
              videoRef={videoRef as React.RefObject<HTMLVideoElement | null>}
              hasPermission={hasCameraPermission}
            />
          )}
          {step === 2 && (
            <StepPrinter
              printers={printers}
              selectedPrinter={selectedPrinter}
              onSelect={handlePrinterSelect}
              onSkip={handleSkipPrinter}
            />
          )}
          {step === 3 && <StepInternet isOnline={isOnline} />}
          {step === 4 && <StepPin onSet={handlePinSet} />}
        </div>

        {step > 0 && step < TOTAL_STEPS - 1 && (
          <div className="flex w-full max-w-md gap-3">
            <Button
              variant="secondary"
              onClick={goBack}
              className="flex items-center gap-2"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Atrás
            </Button>
            <Button
              onClick={goNext}
              className="flex flex-1 items-center justify-center gap-2 gradient-birdcam"
            >
              Siguiente
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 0 && (
          <p className="text-xs text-white/30">
            Configuración rápida • ~2 minutos
          </p>
        )}
      </div>
    </main>
  );
}
