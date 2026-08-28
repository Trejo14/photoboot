import { isTauri } from "./tauri";

export interface Settings {
  adminPin: string;
  cameraDeviceId: string | null;
  printerName: string | null;
  autostart: boolean;
}

const DEFAULTS: Settings = {
  adminPin: "1234",
  cameraDeviceId: null,
  printerName: null,
  autostart: false,
};

let cache: Settings | null = null;

export async function getSettings(): Promise<Settings> {
  if (cache) return cache;
  if (!isTauri) {
    const raw = localStorage.getItem("booth-settings");
    cache = { ...DEFAULTS, ...(raw ? (JSON.parse(raw) as Partial<Settings>) : {}) };
    return cache;
  }
  const { load } = await import("@tauri-apps/plugin-store");
  const store = await load("settings.json");
  const stored = (await store.get<Partial<Settings>>("settings")) ?? {};
  cache = { ...DEFAULTS, ...stored };
  return cache;
}

export async function saveSettings(settings: Settings): Promise<void> {
  cache = settings;
  if (!isTauri) {
    localStorage.setItem("booth-settings", JSON.stringify(settings));
    return;
  }
  const { load } = await import("@tauri-apps/plugin-store");
  const store = await load("settings.json");
  await store.set("settings", settings);
  await store.save();
}