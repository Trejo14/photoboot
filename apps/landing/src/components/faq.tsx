"use client";

import { useState } from "react";
import { cn } from "@photobooth/ui";
import { faqs } from "@/lib/content";
import { Reveal } from "./reveal";
import { ChevronDownIcon } from "./icons";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl font-bold leading-[1.1] text-white sm:text-4xl">
            Preguntas frecuentes
          </h2>
        </Reveal>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={faq.question} delay={i * 40}>
                <div
                  className={cn(
                    "rounded-xl border transition-colors",
                    isOpen ? "border-brand-violet/40 bg-white/[0.03]" : "border-border bg-white/[0.02]"
                  )}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-sm font-semibold text-white sm:text-base">
                      {faq.question}
                    </span>
                    <ChevronDownIcon
                      className={cn(
                        "size-5 shrink-0 text-muted-foreground transition-transform duration-300",
                        isOpen && "rotate-180 text-brand-pink"
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-all duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}