import { useCallback, useEffect, useRef, useState } from "react";
import { useMachine } from "@xstate/react";
import { boothMachine, getScreenForState } from "./machines/booth-machine";
import { env } from "@/lib/env";
import {
  getDevice,
  setDevice,
  clearDevice,
  sendHeartbeat,
  getBoothEventStatus,
} from "@/lib/device";
import type { DeviceInfo } from "@/lib/db";
import { enqueuePhoto, flushPending, listPending } from "@/lib/queue";
import { getLicense, isLicenseExpired, validateLicense } from "@/lib/license";
import { getEffectivePlan } from "@/lib/plan";
import { applyTrialWatermark } from "@/lib/watermark";
import { logout } from "@/lib/api";
import { markSetupComplete } from "@/lib/setup-state";
import { getSettings, type Settings } from "@/lib/settings";
import { enterKioskMode, exitKioskMode, listen } from "@/lib/tauri";
import { SplashScreen, STATUS_MESSAGES } from "@/components/splash-screen";
import { WelcomeWizard } from "@/components/welcome-wizard";
import { AdminLoginScreen } from "@/components/admin-login-screen";
import { PlanSelector } from "@/components/plan-selector";
import { EventMenuScreen } from "@/components/event-menu-screen";
import { FormatSelectionScreen } from "@/components/format-selection-screen";
import { FrameSelectionScreen } from "@/components/frame-selection-screen";
import { CaptureScreen } from "@/components/capture-screen";
import { PreviewScreen } from "@/components/preview-screen";
import { VistaFinalScreen } from "@/components/vista-final-screen";
import { ImprimiendoScreen } from "@/components/imprimiendo-screen";
import { AgradecimientoScreen } from "@/components/agradecimiento-screen";
import { EventFinishedScreen } from "@/components/event-finished-screen";
import { AdminMenuModal } from "@/components/admin-menu-modal";
import { AdminHotDot } from "@/components/admin-hot-dot";
import { LicenseScreen } from "@/components/license-screen";
import { StatusBar } from "@/components/status-bar";
import {
  ExitConfirmModal,
  type ExitConfirmMode,
} from "@/components/exit-confirm-modal";
import { BoothLayout } from "@/components/booth-layout";
import { composeFrame } from "@/lib/compose";
import { printImage } from "@/lib/print";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runBootSequence(send: (event: any) => void) {
  send({ type: "SET_SPLASH", progress: 10, text: STATUS_MESSAGES[0] ?? "" });
  await new Promise((r) => setTimeout(r, 200));

  const d = await getDevice();
  send({ type: "SET_SPLASH", progress: 40, text: STATUS_MESSAGES[1] ?? "" });
  await new Promise((r) => setTimeout(r, 200));

  const lic = await getLicense();
  send({ type: "SET_SPLASH", progress: 60, text: STATUS_MESSAGES[2] ?? "" });
  await new Promise((r) => setTimeout(r, 200));

  if (d && lic && isLicenseExpired(lic)) {
    send({ type: "LICENSE_BLOCKED" });
  }
  if (d && lic && navigator.onLine) {
    void validateLicense(d.deviceToken)
      .then(async () => {
        const freshLic = await getLicense();
        if (freshLic) send({ type: "LICENSE_ACTIVATED", license: freshLic });
      })
      .catch(() => undefined);
  }

  // Only checkable online; offline booths keep working until the next
  // successful check (matches the offline-first sync/license design).
  let eventFinished = false;
  let eventName: string | null = null;
  if (d && navigator.onLine) {
    try {
      const status = await getBoothEventStatus(d.deviceToken);
      eventFinished = status.finished;
      eventName = status.eventName;
    } catch {
      // ignore — treat as not-finished, don't block the booth on a flaky request
    }
  }

  send({ type: "SET_SPLASH", progress: 100, text: STATUS_MESSAGES[3] ?? "" });
  await new Promise((r) => setTimeout(r, 400));

  if (d) {
    await enterKioskMode();
  }
  send({
    type: "BOOT_COMPLETE",
    device: d,
    license: lic,
    eventFinished,
    eventName,
  });
}

function loadImageBlob(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen"));
    };
    img.src = url;
  });
}

export function App() {
  const [state, send] = useMachine(boothMachine);
  const screen = getScreenForState(state);
  const bootRunningRef = useRef(false);

  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [licenseOverlayOpen, setLicenseOverlayOpen] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  useEffect(() => {
    void getSettings().then(setSettings);
  }, []);
  // Printing on the desktop app is silent by design (guests shouldn't see
  // the Windows print dialog), which makes a failed/misconfigured printer
  // look identical to "nothing happened". Surface what actually ran so
  // this is debuggable during setup instead of a silent black box.
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);

  const lastFrame = state.context.frames[state.context.frames.length - 1];
  const [previewUrl, setPreviewUrl] = useState("");
  useEffect(() => {
    if (!lastFrame) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(lastFrame);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [lastFrame]);

  const refreshPending = useCallback(async () => {
    const pending = await listPending();
    send({ type: "SET_PENDING", count: pending.length });
  }, [send]);

  // Concurrent callers (the periodic sync timers and a just-captured photo)
  // share the same in-flight flush instead of bailing out with an empty
  // result, so a photo taken while a background flush is running still gets
  // its real photoId back (needed for its QR code) instead of never
  // resolving one.
  const flushPromiseRef = useRef<ReturnType<typeof flushPending> | null>(null);
  const flushFor = useCallback(
    async (d: DeviceInfo) => {
      if (!navigator.onLine)
        return {
          synced: 0,
          failed: 0,
          photoIds: [] as string[],
          photoIdByEntryId: {} as Record<string, string>,
        };
      if (flushPromiseRef.current) return flushPromiseRef.current;
      send({ type: "SET_SYNCING", syncing: true });
      const promise = flushPending(d.deviceToken).finally(() => {
        flushPromiseRef.current = null;
        void refreshPending();
        send({ type: "SET_SYNCING", syncing: false });
      });
      flushPromiseRef.current = promise;
      return promise;
    },
    [refreshPending, send],
  );

  // Boot sequence - runs every time we enter splash
  useEffect(() => {
    if (screen !== "splash") {
      bootRunningRef.current = false;
      return;
    }
    if (bootRunningRef.current) return;
    bootRunningRef.current = true;
    void runBootSequence(send);
  }, [screen, send]);

  // Online/offline + sync
  useEffect(() => {
    const onOnline = () => {
      send({ type: "GO_ONLINE" });
      const device = state.context.device;
      if (device) void flushFor(device);
    };
    const onOffline = () => send({ type: "GO_OFFLINE" });
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const refreshIv = setInterval(() => void refreshPending(), 3000);
    // Retries "failed" uploads even while nominally online, since a
    // transient server error (not a connectivity drop) never fires the
    // browser's "online" event on its own.
    const retryIv = setInterval(() => {
      const device = state.context.device;
      if (device && navigator.onLine) void flushFor(device);
    }, 20000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(refreshIv);
      clearInterval(retryIv);
    };
  }, [state.context.device, flushFor, refreshPending, send]);

  // Periodic heartbeat so the admin panel's "last seen" stays fresh
  useEffect(() => {
    const device = state.context.device;
    if (!device) return;
    const beat = () => {
      if (navigator.onLine)
        void sendHeartbeat(device.deviceToken).catch(() => undefined);
    };
    beat();
    const iv = setInterval(beat, 60_000);
    return () => clearInterval(iv);
  }, [state.context.device]);

  // Tauri exit confirm listener
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen("show-exit-confirm", () => {
      setExitConfirmOpen(true);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, []);

  // Auto-print timer when entering vista-final
  useEffect(() => {
    if (screen === "vista-final") {
      const timer = setTimeout(() => {
        send({ type: "AUTO_PRINT" });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [screen, send]);

  // Handle printing when entering imprimiendo state
  useEffect(() => {
    if (screen === "imprimiendo" && state.context.composedBlob) {
      const blob = state.context.composedBlob;
      void (async () => {
        try {
          const url = URL.createObjectURL(blob);
          try {
            const mode = await printImage(blob, url, {
              printer: settings?.printerName,
              copies: settings?.printCopies,
              orientation: settings?.printOrientation,
              paperSize: settings?.printPaperSize,
            });
            const label =
              mode === "thermal"
                ? "Impreso en impresora térmica"
                : mode === "silent"
                  ? "Enviado a la impresora predeterminada"
                  : "Abriendo el diálogo de impresión de Windows…";
            setPrintFeedback(label);
            await new Promise((r) => setTimeout(r, 1200));
            send({ type: "PRINT_SUCCESS" });
          } finally {
            setPrintFeedback(null);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }
        } catch (err) {
          send({
            type: "PRINT_FAILED",
            error: err instanceof Error ? err.message : "Error al imprimir",
          });
        }
      })();
    }
  }, [screen, state.context.composedBlob, send, settings]);

  async function handleWizardComplete() {
    await markSetupComplete();
    send({ type: "WIZARD_COMPLETE" });
  }

  async function handleLoginSuccess() {
    send({ type: "LOGIN_SUCCESS" });
  }

  async function handleRegister(info: { eventId: string; boothName: string }) {
    if (!navigator.onLine) {
      throw new Error(
        "Sin conexión a internet. Conéctate para registrar la cabina.",
      );
    }
    try {
      const res = await fetch(`${env.API_URL}/booths/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: info.eventId, name: info.boothName }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = (await res.json()) as {
        boothId: string;
        deviceToken: string;
      };
      const next: DeviceInfo = {
        key: "device",
        boothId: data.boothId,
        eventId: info.eventId,
        deviceToken: data.deviceToken,
        boothName: info.boothName,
      };
      await setDevice(next);
      await enterKioskMode();
      send({ type: "REGISTER_SUCCESS", device: next });
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Sin conexión"))
        throw err;
      throw new Error(
        "No pudimos conectar con el servidor. Verifica tu conexión a internet.",
      );
    }
  }

  function handleCapture(blob: Blob) {
    send({ type: "FRAME_CAPTURED", blob });
  }

  function handleAllCaptured(frames: Blob[]) {
    send({ type: "ALL_FRAMES_CAPTURED", frames });
  }

  async function handleSave() {
    const { frames, format, device, frameTemplate } = state.context;
    if (!device || frames.length === 0) return;

    const photoId = crypto.randomUUID();

    let composedImageUrl: string;
    let composedBlob: Blob;

    try {
      if (frameTemplate) {
        const result = await composeFrame(frames, frameTemplate, photoId);
        composedImageUrl = result.imageUrl;
        composedBlob = result.blob;
      } else if (frames.length === 1) {
        composedBlob = frames[0]!;
        composedImageUrl = URL.createObjectURL(composedBlob);
      } else {
        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 200 * frames.length;
        const ctx = canvas.getContext("2d")!;
        for (let i = 0; i < frames.length; i++) {
          const img = await loadImageBlob(frames[i]!);
          ctx.drawImage(img, 0, i * 200, 600, 200);
        }
        composedBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("toBlob falló"))),
            "image/jpeg",
            0.95,
          );
        });
        composedImageUrl = URL.createObjectURL(composedBlob);
      }
    } catch (err) {
      console.error("Compose failed, using raw frame:", err);
      composedBlob = frames[0]!;
      composedImageUrl = URL.createObjectURL(composedBlob);
    }

    if (getEffectivePlan(state.context.license) === "free") {
      try {
        const watermarked = await applyTrialWatermark(composedBlob);
        URL.revokeObjectURL(composedImageUrl);
        composedBlob = watermarked;
        composedImageUrl = URL.createObjectURL(watermarked);
      } catch (err) {
        console.error("No se pudo aplicar la marca de agua de prueba:", err);
      }
    }

    const entry = await enqueuePhoto(
      composedBlob,
      format?.id === "single" ? "single" : "strip",
      null,
    );
    await refreshPending();
    const result = await flushFor(device);

    // Only use a photoId that's actually been uploaded — this specific
    // entry may not be the one flushed first (or at all, if offline), and
    // the QR/gallery link would 404 forever if it pointed at an ID the
    // server never created. `null` tells the delivery screens to show
    // "will sync when online" instead of a dead link.
    send({
      type: "COMPOSE_COMPLETE",
      imageUrl: composedImageUrl,
      blob: composedBlob,
      photoId: result.photoIdByEntryId[entry.id] ?? null,
    });
  }

  function handleRetake() {
    send({ type: "RETAKE" });
  }

  async function handleSwitchEvent() {
    await exitKioskMode();
    send({ type: "SWITCH_EVENT" });
  }

  async function handleLogout() {
    await logout();
    await clearDevice();
    await exitKioskMode();
    send({ type: "LOGOUT" });
  }

  // ── Navegación global (Volver / Salir) ──
  // Derivado directo de la máquina de estados: si el estado actual no
  // define una transición BACK/ABANDON_SESSION, el botón correspondiente
  // se desactiva solo — no hay lista de pantallas que mantener a mano, así
  // que una pantalla nueva nunca puede "olvidarse" de estos botones.
  const canGoBack = state.can({ type: "BACK" });
  const canAbandonSession = state.can({ type: "ABANDON_SESSION" });
  const exitMode: ExitConfirmMode = canAbandonSession
    ? screen === "imprimiendo"
      ? "abandon-printing"
      : "abandon-session"
    : "quit-app";

  function handleBack() {
    send({ type: "BACK" });
  }

  function handleAbandonSession() {
    setExitConfirmOpen(false);
    send({ type: "ABANDON_SESSION" });
  }

  return (
    <>
      <BoothLayout
        canGoBack={canGoBack}
        onBack={handleBack}
        onExit={() => setExitConfirmOpen(true)}
      >
        {renderScreen()}
      </BoothLayout>
      <ExitConfirmModal
        open={exitConfirmOpen}
        mode={exitMode}
        onClose={() => setExitConfirmOpen(false)}
        onAbandonSession={handleAbandonSession}
      />
      {licenseOverlayOpen && state.context.device && (
        <div className="fixed inset-0 z-50">
          <LicenseScreen
            deviceToken={state.context.device.deviceToken}
            onActivated={(license) => {
              send({ type: "LICENSE_ACTIVATED", license });
              setLicenseOverlayOpen(false);
            }}
            onCancel={() => setLicenseOverlayOpen(false)}
          />
        </div>
      )}
    </>
  );

  function renderScreen() {
    if (screen === "splash") {
      return (
        <SplashScreen
          progress={state.context.splashProgress}
          statusText={state.context.splashText}
        />
      );
    }

    if (screen === "wizard") {
      return <WelcomeWizard onComplete={handleWizardComplete} />;
    }

    if (screen === "login") {
      return (
        <AdminLoginScreen
          onAuthenticated={handleLoginSuccess}
          onSelectPlan={(plan) => {
            send({ type: "SELECT_PLAN", plan });
          }}
        />
      );
    }

    if (screen === "plan-selector") {
      return (
        <PlanSelector
          onPlanSelected={(plan) => send({ type: "SELECT_PLAN", plan })}
          onBack={() => send({ type: "BACK" })}
        />
      );
    }

    if (screen === "event-menu") {
      return <EventMenuScreen onRegister={handleRegister} />;
    }

    if (screen === "event-finished") {
      return (
        <EventFinishedScreen
          eventName={state.context.eventName}
          onSwitchEvent={handleSwitchEvent}
        />
      );
    }

    if (screen === "format-selection") {
      return (
        <FormatSelectionScreen
          onSelect={(format) => send({ type: "FORMAT_SELECTED", format })}
          onBack={() => send({ type: "SWITCH_EVENT" })}
        />
      );
    }

    if (screen === "frame-selection" && state.context.format) {
      return (
        <FrameSelectionScreen
          format={state.context.format}
          license={state.context.license}
          onSelect={(frame) => send({ type: "FRAME_SELECTED", frame })}
          onSkip={() => send({ type: "SKIP_FRAME" })}
          onOpenLicense={() => setLicenseOverlayOpen(true)}
        />
      );
    }

    const device = state.context.device;
    const showStatusAndDevice =
      device &&
      screen !== "agradecimiento" &&
      screen !== "imprimiendo" &&
      screen !== "vista-final";

    if (screen === "capture") {
      return (
        <div className="relative min-h-dvh bg-black">
          {env.IS_DEV && <div className="dev-badge">MODO DESARROLLO</div>}
          <CaptureScreen
            format={state.context.format}
            onCapture={handleCapture}
            onAllCaptured={handleAllCaptured}
          />
          {showStatusAndDevice && (
            <>
              {/* top-16 en vez de top-4: deja espacio para Volver/Salir de
                  BoothLayout, que ahora ya cubren el "salir" que este botón
                  dev-only hacía antes. */}
              <button
                onClick={() => send({ type: "SHOW_LICENSE_SCREEN" })}
                className="absolute right-4 top-16 z-10 rounded-md bg-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/20"
              >
                {getEffectivePlan(state.context.license) === "free"
                  ? "Modo de prueba · Activar licencia"
                  : `Licencia ${state.context.license?.plan}`}
              </button>
              <StatusBar
                online={state.context.online}
                pending={state.context.pendingCount}
                syncing={state.context.syncing}
              />
              <AdminMenuModal
                onSwitchEvent={handleSwitchEvent}
                onLogout={handleLogout}
                onSettingsChange={setSettings}
                lastPhoto={
                  state.context.composedBlob && state.context.composedImageUrl
                    ? {
                        blob: state.context.composedBlob,
                        imageUrl: state.context.composedImageUrl,
                      }
                    : null
                }
              />
              <AdminHotDot />
            </>
          )}
        </div>
      );
    }

    if (screen === "preview") {
      return (
        <div className="relative min-h-dvh bg-black">
          {env.IS_DEV && <div className="dev-badge">MODO DESARROLLO</div>}
          <PreviewScreen
            imageUrl={previewUrl}
            onSave={handleSave}
            onRetake={handleRetake}
          />
        </div>
      );
    }

    if (screen === "vista-final" && state.context.composedImageUrl) {
      return (
        <VistaFinalScreen
          imageUrl={state.context.composedImageUrl}
          onAutoPrint={() => send({ type: "AUTO_PRINT" })}
          durationMs={settings?.photoDisplayMs}
        />
      );
    }

    if (screen === "imprimiendo") {
      return (
        <ImprimiendoScreen
          error={state.context.printerError}
          feedback={printFeedback}
          onRetry={() => send({ type: "PRINT_RETRY" })}
          onSkip={() => send({ type: "SKIP_PRINT" })}
        />
      );
    }

    if (screen === "agradecimiento") {
      return (
        <AgradecimientoScreen
          photoId={state.context.photoId}
          onTimeout={() => send({ type: "THANKS_TIMEOUT" })}
          durationMs={settings?.thanksDisplayMs}
        />
      );
    }

    if (screen === "license" && device) {
      return (
        <LicenseScreen
          deviceToken={device.deviceToken}
          onActivated={(lic) =>
            send({ type: "LICENSE_ACTIVATED", license: lic })
          }
          onCancel={
            state.context.licenseBlocked
              ? undefined
              : () => send({ type: "HIDE_LICENSE_SCREEN" })
          }
        />
      );
    }

    return (
      <div className="relative min-h-dvh bg-black">
        {env.IS_DEV && <div className="dev-badge">MODO DESARROLLO</div>}
      </div>
    );
  }
}
