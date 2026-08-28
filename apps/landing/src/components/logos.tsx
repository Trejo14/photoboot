import { socialProof } from "@/lib/content";

export function Logos() {
  const items = [...socialProof, ...socialProof];
  return (
    <section className="border-y border-white/5 bg-white/[0.02] py-12">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Usado en más de 2,500 eventos
      </p>
      <div className="relative mt-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <div className="animate-marquee flex w-max">
          {items.map((item, i) => (
            <span
              key={i}
              className="whitespace-nowrap pr-14 text-lg font-semibold text-muted-foreground/60"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}