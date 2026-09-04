import { useCallback, useEffect, useRef, useState } from "react";
import { useMachine } from "@xstate/react";
import { boothMachine, getScreenForState } from "./machines/booth-machine";
import { env } from "@/lib/env";
import { getDevice, setDevice, sendHeartbeat } from "@/lib/device";
import type { DeviceInfo } from "@/lib/db";
import { enqueuePhoto, flushPending, listPending } from "@/lib/queue";
import { getLicense, isLicenseExpired, validateLicense } from "@/lib/license";
import { logout } from "@/lib/api";
import { markSetupComplete } from "@/lib/setup-state";
import { enterKioskMode, exitKioskMode, listen, invoke } from "@/lib/tauri";
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
import { AdminMenuModal } from "@/components/admin-menu-modal";
import { AdminHotDot } from "@/components/admin-hot-dot";
import { LicenseScreen } from "@/components/license-screen";
import { StatusBar } from "@/components/status-bar";
import { ExitConfirmModal } from "@/components/exit-confirm-modal";
import { PowerIcon } from "@/components/icons";
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

  send({ type: "SET_SPLASH", progress: 100, text: STATUS_MESSAGES[3] ?? "" });
  await new Promise((r) => setTimeout(r, 400));

  if (d) {
    await enterKioskMode();
  }
  send({ type: "BOOT_COMPLETE", device: d, license: lic });
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

  const refreshPending = useCallback(async () => {
    const pending = await listPending();
    send({ type: "SET_PENDING", count: pending.length });
  }, [send]);

  const flushFor = useCallback(
    async (d: DeviceInfo) => {
      if (!navigator.onLine)
        return { synced: 0, failed: 0, photoIds: [] as string[] };
      send({ type: "SET_SYNCING", syncing: true });
      try {
        return await flushPending(d.deviceToken);
      } finally {
        await refreshPending();
        send({ type: "SET_SYNCING", syncing: false });
      }
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
    const iv = setInterval(() => void refreshPending(), 3000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(iv);
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
            await printImage(blob, url);
            send({ type: "PRINT_SUCCESS" });
          } finally {
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
  }, [screen, state.context.composedBlob, send]);

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

    await enqueuePhoto(
      composedBlob,
      format?.id === "single" ? "single" : "strip",
      null,
    );
    await refreshPending();
    const result = await flushFor(device);

    send({
      type: "COMPOSE_COMPLETE",
      imageUrl: composedImageUrl,
      blob: composedBlob,
      photoId: result.photoIds[0] ?? photoId,
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
    await exitKioskMode();
    send({ type: "LOGOUT" });
  }

  // ── Render ──
  const showCloseButton = ["wizard", "login", "plan-selector", "event-menu"].includes(
    screen
  );

  return (
    <>
      {renderScreen()}
      {showCloseButton && (
        <button
          onClick={() => setExitConfirmOpen(true)}
          aria-label="Cerrar Birdcam"
          title="Cerrar Birdcam"
          className="fixed right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/70 backdrop-blur transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
        >
          <PowerIcon className="h-5 w-5" />
        </button>
      )}
      <ExitConfirmModal
        open={exitConfirmOpen}
        onClose={() => setExitConfirmOpen(false)}
      />
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
          onBack={() => send({ type: "BACK_TO_LOGIN" })}
        />
      );
    }

    if (screen === "event-menu") {
      return <EventMenuScreen onRegister={handleRegister} />;
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
          onSelect={(frame) => send({ type: "FRAME_SELECTED", frame })}
          onSkip={() => send({ type: "SKIP_FRAME" })}
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
              {env.IS_DEV && (
                <button
                  onClick={() => void invoke("exit_app")}
                  className="absolute left-4 top-4 z-10 rounded-md bg-red-500/20 px-3 py-1 text-xs text-red-400 hover:bg-red-500/40"
                >
                  ✕ Salir
                </button>
              )}
              <button
                onClick={() => send({ type: "SHOW_LICENSE_SCREEN" })}
                className="absolute right-4 top-4 z-10 rounded-md bg-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/20"
              >
                {state.context.license
                  ? `Licencia ${state.context.license.plan}`
                  : "Activar licencia"}
              </button>
              <StatusBar
                online={state.context.online}
                pending={state.context.pendingCount}
                syncing={state.context.syncing}
              />
              <AdminMenuModal
                onSwitchEvent={handleSwitchEvent}
                onLogout={handleLogout}
              />
              <AdminHotDot />
            </>
          )}
        </div>
      );
    }

    if (screen === "preview") {
      const lastFrame = state.context.frames[state.context.frames.length - 1];
      const previewUrl = lastFrame ? URL.createObjectURL(lastFrame) : "";
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
        />
      );
    }

    if (screen === "imprimiendo") {
      return (
        <ImprimiendoScreen
          error={state.context.printerError}
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
