import { isTauri } from "./tauri";

interface SetupState {
  setupComplete: boolean;
}

let cache: SetupState | null = null;

export async function getSetupState(): Promise<SetupState> {
  if (cache) return cache;
  if (!isTauri) {
    const raw = localStorage.getItem("booth-setup");
    cache = raw ? (JSON.parse(raw) as SetupState) : { setupComplete: false };
    return cache;
  }
  const { load } = await import("@tauri-apps/plugin-store");
  const store = await load("settings.json");
  const stored = (await store.get<SetupState>("setup")) ?? { setupComplete: false };
  cache = stored;
  return cache;
}

export async function isFirstRun(): Promise<boolean> {
  const state = await getSetupState();
  return !state.setupComplete;
}

export async function markSetupComplete(): Promise<void> {
  const state: SetupState = { setupComplete: true };
  cache = state;
  if (!isTauri) {
    localStorage.setItem("booth-setup", JSON.stringify(state));
    return;
  }
  const { load } = await import("@tauri-apps/plugin-store");
  const store = await load("settings.json");
  await store.set("setup", state);
  await store.save();
}
