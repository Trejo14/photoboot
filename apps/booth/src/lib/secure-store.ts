import { isTauri } from "./tauri";

const ENCRYPTION_ALGO = "AES-GCM";
const KEY_LENGTH = 256;
const PBKDF2_ITERATIONS = 100000;
const DEVICE_SALT = "birdcam-secure-store-salt-v1";

let keyCache: CryptoKey | null = null;

async function getEncryptionKey(): Promise<CryptoKey> {
  if (keyCache) return keyCache;

  const encoder = new TextEncoder();
  const salt = encoder.encode(DEVICE_SALT);

  let passwordSource: CryptoKey;

  if (isTauri) {
    const { invoke } = await import("@tauri-apps/api/core");
    const deviceId: string = await invoke("get_device_id");
    passwordSource = await crypto.subtle.importKey(
      "raw",
      encoder.encode(deviceId),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
  } else {
    let fallbackId = localStorage.getItem("birdcam-device-id");
    if (!fallbackId) {
      fallbackId = crypto.randomUUID();
      localStorage.setItem("birdcam-device-id", fallbackId);
    }
    passwordSource = await crypto.subtle.importKey(
      "raw",
      encoder.encode(fallbackId),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
  }

  keyCache = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordSource,
    { name: ENCRYPTION_ALGO, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );

  return keyCache;
}

export async function encryptValue(value: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();

  const encrypted = await crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGO, iv },
    key,
    encoder.encode(value)
  );

  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptValue(encryptedBase64: string): Promise<string> {
  const key = await getEncryptionKey();
  const combined = Uint8Array.from(atob(encryptedBase64), (c) =>
    c.charCodeAt(0)
  );

  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: ENCRYPTION_ALGO, iv },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}

export async function secureSet(
  key: string,
  value: string | null
): Promise<void> {
  if (!isTauri) {
    if (value !== null) {
      localStorage.setItem(`booth-secure-${key}`, value);
    } else {
      localStorage.removeItem(`booth-secure-${key}`);
    }
    return;
  }
  const { load } = await import("@tauri-apps/plugin-store");
  const store = await load("settings.json");
  if (value !== null) {
    const encrypted = await encryptValue(value);
    await store.set(`secure_${key}`, encrypted);
  } else {
    await store.delete(`secure_${key}`);
  }
  await store.save();
}

export async function secureGet(key: string): Promise<string | null> {
  if (!isTauri) {
    return localStorage.getItem(`booth-secure-${key}`);
  }
  const { load } = await import("@tauri-apps/plugin-store");
  const store = await load("settings.json");
  const encrypted = await store.get<string>(`secure_${key}`);
  if (!encrypted) return null;
  return decryptValue(encrypted);
}
