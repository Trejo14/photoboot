import type { ReactNode } from "react";
import { Reveal } from "./reveal";

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

interface LegalPageProps {
  title: string;
  updatedAt: string;
  intro?: string;
  sections: LegalSection[];
}

export function LegalPage({ title, updatedAt, intro, sections }: LegalPageProps) {
  return (
    <section className="relative pb-24 pt-32 lg:pb-32 lg:pt-40">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <Reveal>
          <h1 className="font-display text-3xl font-bold leading-[1.1] text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Última actualización: {updatedAt}
          </p>
          {intro ? (
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">{intro}</p>
          ) : null}
        </Reveal>

        <div className="mt-12 space-y-10">
          {sections.map((section, i) => (
            <Reveal key={section.heading} delay={Math.min(i * 40, 200)}>
              <h2 className="font-display text-xl font-bold text-white">{section.heading}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                {section.body}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
