import { env } from "./env";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`API ${res.status} on ${path}${detail ? `: ${detail}` : ""}`);
  }
  return res.json() as Promise<T>;
}

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": env.ADMIN_KEY,
    },
    ...init,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`API ${res.status} on ${path}${detail ? `: ${detail}` : ""}`);
  }
  return res.json() as Promise<T>;
}