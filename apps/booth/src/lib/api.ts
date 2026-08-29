import { env } from "./env";
import { isTauri } from "./tauri";
import { secureGet, secureSet } from "./secure-store";

let tokenCache: string | null = null;

export async function getAuthToken(): Promise<string | null> {
  if (tokenCache !== null) return tokenCache;
  if (!isTauri) {
    tokenCache = localStorage.getItem("booth-auth-token");
    return tokenCache;
  }
  tokenCache = await secureGet("authToken");
  return tokenCache;
}

export async function setAuthToken(token: string | null): Promise<void> {
  tokenCache = token;
  if (!isTauri) {
    if (token) {
      localStorage.setItem("booth-auth-token", token);
    } else {
      localStorage.removeItem("booth-auth-token");
    }
    return;
  }
  await secureSet("authToken", token);
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${env.API_URL}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg =
      (body as { message?: string }).message || `Error ${res.status}`;
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function requestCode(email: string): Promise<{ message: string }> {
  return apiRequest("/auth/request-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyCode(
  email: string,
  code: string
): Promise<{ token: string; user: { id: string; email: string; name: string | null } }> {
  const data = await apiRequest<{
    token: string;
    user: { id: string; email: string; name: string | null };
  }>("/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
  await setAuthToken(data.token);
  return data;
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<{ token: string; user: { id: string; email: string; name: string } }> {
  const data = await apiRequest<{
    token: string;
    user: { id: string; email: string; name: string };
  }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  await setAuthToken(data.token);
  return data;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  organizationId: string | null;
  organization: { id: string; name: string; plan: string } | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const data = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  await setAuthToken(data.token);
  return data;
}

export async function getProfile(): Promise<{
  id: string;
  email: string;
  name: string | null;
  plan: string;
  planStatus: string | null;
  organizationId: string | null;
  organization: { id: string; name: string; plan: string } | null;
}> {
  return apiRequest("/auth/me");
}

export async function logout(): Promise<void> {
  await setAuthToken(null);
}

export interface EventItem {
  id: string;
  name: string;
  organizationId: string;
  startDate: string;
  endDate: string | null;
  isOffline: boolean;
  _count: { booths: number; photos: number };
}

export async function listEvents(): Promise<EventItem[]> {
  return apiRequest<EventItem[]>("/events");
}
