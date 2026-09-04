import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Panel Birdcam",
  description: "Panel de administración",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-background text-foreground">{children}</div>;
}
