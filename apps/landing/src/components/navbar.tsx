"use client";

import { useEffect, useState } from "react";
import { cn } from "@photobooth/ui";
import { navLinks } from "@/lib/content";
import { CloseIcon, MenuIcon } from "./icons";
import { Logo } from "./logo";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled || open
          ? "border-b border-white/5 bg-[#0a0a12]"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
        <a href="#" className="flex items-center gap-2.5 text-base font-bold tracking-tight text-white">
          <Logo className="size-8" />
          BIRDCAM
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="/cuenta"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Iniciar sesión
          </a>
          <a href="#precios" className="btn-gradient h-10 px-5 text-sm">
            Empezar gratis
          </a>
        </div>

        <button
          type="button"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-white/5 md:hidden"
        >
          {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
        </button>
      </nav>

      {open ? (
        <div className="border-t border-white/5 px-5 pb-6 pt-3 md:hidden">
          <div className="flex flex-col">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-white/5"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/cuenta"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-white/5"
            >
              Iniciar sesión
            </a>
          </div>
          <a href="#precios" onClick={() => setOpen(false)} className="btn-gradient mt-4 h-11 w-full text-base">
            Empezar gratis
          </a>
        </div>
      ) : null}
    </header>
  );
}