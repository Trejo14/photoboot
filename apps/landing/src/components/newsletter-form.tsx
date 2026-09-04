"use client";

import { useState, type FormEvent } from "react";
import { env } from "@/lib/env";
import { ArrowRightIcon } from "./icons";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-3 text-sm text-brand-cyan">
        ¡Listo! Ya estás suscrito a las novedades de Birdcam.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="newsletter-email">
          Correo electrónico
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="h-11 w-full min-w-0 flex-1 rounded-full border border-border bg-white/5 px-5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-violet/60 focus:outline-none focus:ring-1 focus:ring-brand-violet/40"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-gradient h-11 shrink-0 px-5 text-sm disabled:opacity-60"
          aria-label="Suscribirme"
        >
          <ArrowRightIcon className="size-4" />
        </button>
      </div>
      {status === "error" ? (
        <p className="text-xs text-red-400">No se pudo suscribir. Intenta de nuevo.</p>
      ) : null}
    </form>
  );
}