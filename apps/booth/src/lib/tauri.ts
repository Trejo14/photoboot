export const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export async function invoke<T>(
  cmd: string,
  args?: Record<string, unknown>
): Promise<T> {
  if (!isTauri) {
    throw new Error("Tauri no disponible");
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args);
}

export async function listen<T>(
  event: string,
  handler: (payload: T) => void
): Promise<() => void> {
  if (!isTauri) {
    return () => undefined;
  }
  const { listen } = await import("@tauri-apps/api/event");
  return listen<T>(event, (e) => handler(e.payload));
}

export async function enterKioskMode(): Promise<void> {
  if (!isTauri) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  const win = getCurrentWindow();
  await win.setResizable(false);
  await win.setFullscreen(true);
}

export async function exitKioskMode(): Promise<void> {
  if (!isTauri) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  const win = getCurrentWindow();
  await win.setFullscreen(false);
  await win.setResizable(true);
}

export async function isFullscreen(): Promise<boolean> {
  if (!isTauri) return false;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  return getCurrentWindow().isFullscreen();
}