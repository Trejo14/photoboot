"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import type { CustomerLicense, LicensePlan } from "@photobooth/types";
import { env } from "@/lib/env";

const TOKEN_KEY = "birdcam-token";

interface Profile {
  email: string;
  name: string | null;
  licenses: CustomerLicense[];
}

const PLAN_LABELS: Record<LicensePlan, string> = {
  free: "Gratis",
  pro: "PRO",
  lifetime: "LIFETIME",
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = (await res.json().catch(() => null)) as
    | (T & { message?: string | string[] })
    | null;
  if (!res.ok || !data) {
    const message = data?.message;
    throw new Error(
      (Array.isArray(message) ? message[0] : message) ?? `Error ${res.status}`
    );
  }
  return data;
}

function isUsable(license: CustomerLicense): boolean {
  return (
    license.status === "active" &&
    (!license.expiresAt || new Date(license.expiresAt).getTime() >= Date.now())
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-border bg-white/5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-violet/60 focus:outline-none focus:ring-1 focus:ring-brand-violet/40";

export function AccountPanel() {
  const [step, setStep] = useState<"loading" | "email" | "code" | "account">("loading");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  async function loadProfile(token: string) {
    const data = await api<Profile>("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setProfile(data);
    setStep("account");
  }

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setStep("email");
      return;
    }
    loadProfile(token).catch(() => {
      localStorage.removeItem(TOKEN_KEY);
      setStep("email");
    });
  }, []);

  async function handleRequestCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api("/auth/request-code", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el código");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!code || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { token } = await api<{ token?: string }>("/auth/verify-code", {
        method: "POST",
        body: JSON.stringify({ email, code: code.trim() }),
      });
      if (!token) throw new Error("Código inválido o expirado");
      localStorage.setItem(TOKEN_KEY, token);
      await loadProfile(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido o expirado");
    } finally {
      setBusy(false);
    }
  }

  function handleSignOut() {
    localStorage.removeItem(TOKEN_KEY);
    setProfile(null);
    setCode("");
    setStep("email");
  }

  if (step === "loading") {
    return <p className="text-center text-sm text-muted-foreground">Cargando…</p>;
  }

  if (step === "account" && profile) {
    const active = profile.licenses.filter(isUsable);
    const plan: LicensePlan = active.some((l) => l.plan === "lifetime")
      ? "lifetime"
      : active.some((l) => l.plan === "pro")
        ? "pro"
        : "free";

    return (
      <div>
        <h1 className="font-display text-3xl font-bold leading-[1.1] text-white">Mi cuenta</h1>
        <div className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Correo</span>
            <span className="text-foreground">{profile.email}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-semibold text-white">{PLAN_LABELS[plan]}</span>
          </div>
        </div>

        <h2 className="mt-8 text-lg font-semibold text-white">Tu ID de membresía</h2>
        {profile.licenses.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Todavía no tienes una membresía con este correo.{" "}
            <Link href="/#precios" className="font-semibold text-brand-pink hover:underline">
              Ver planes
            </Link>
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {profile.licenses.map((license) => (
              <li
                key={license.licenseKey}
                className="rounded-xl border border-border bg-card p-4 text-sm"
              >
                <p className="break-all font-mono text-base text-brand-violet">
                  {license.licenseKey}
                </p>
                <p className="mt-1.5 text-muted-foreground">
                  {PLAN_LABELS[license.plan]} ·{" "}
                  {isUsable(license)
                    ? license.expiresAt
                      ? `vigente hasta el ${new Date(license.expiresAt).toLocaleDateString("es-MX")}`
                      : "activa"
                    : license.status === "revoked"
                      ? "revocada"
                      : "expirada"}
                </p>
              </li>
            ))}
          </ul>
        )}

        <button type="button" onClick={handleSignOut} className="btn-ghost mt-8 h-11 w-full text-sm">
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold leading-[1.1] text-white">Iniciar sesión</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {step === "email"
          ? "Escribe tu correo y te enviamos un código para entrar. Si compraste un plan, usa el mismo correo de tu compra."
          : `Te enviamos un código de 6 dígitos a ${email}. Expira en 10 minutos.`}
      </p>

      {step === "email" ? (
        <form onSubmit={handleRequestCode} className="mt-8 space-y-3">
          <label className="sr-only" htmlFor="account-email">
            Correo electrónico
          </label>
          <input
            id="account-email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className={inputClass}
          />
          <button type="submit" disabled={busy} className="btn-gradient h-11 w-full text-base disabled:opacity-60">
            {busy ? "Enviando…" : "Enviar código"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="mt-8 space-y-3">
          <label className="sr-only" htmlFor="account-code">
            Código de verificación
          </label>
          <input
            id="account-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
            className={`${inputClass} text-center font-mono text-lg tracking-[0.4em]`}
          />
          <button type="submit" disabled={busy} className="btn-gradient h-11 w-full text-base disabled:opacity-60">
            {busy ? "Verificando…" : "Entrar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="w-full text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Usar otro correo
          </button>
        </form>
      )}

      {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
