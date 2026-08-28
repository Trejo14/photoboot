"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@photobooth/ui";
import { useInView } from "@/lib/use-in-view";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  style?: CSSProperties;
}

export function Reveal({ children, className, delay = 0, style }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn("reveal", inView && "is-visible", className)}
      style={{ ...style, transitionDelay: delay ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}