"use client";

import { useState, type FormEvent } from "react";
import { ArrowRightIcon } from "./icons";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setDone(true);
  }

  if (done) {
    return (
      <p className="rounded-xl border border-brand-pink/30 bg-brand-pink/10 px-4 py-3 text-sm text-brand-pink">
        ¡Listo! Revisa tu correo para recibir las novedades de Birdcam.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
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
        className="h-11 w-full min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-violet/60 focus:outline-none focus:ring-1 focus:ring-brand-violet/40"
      />
      <button type="submit" className="btn-gradient h-11 shrink-0 px-5 text-sm" aria-label="Suscribirme">
        <ArrowRightIcon className="size-4" />
      </button>
    </form>
  );
}