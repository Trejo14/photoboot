import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Birdcam — Photobooth con IA para tus eventos",
    template: "%s · Birdcam",
  },
  description:
    "Cabinas de fotos con IA, listas en 2 minutos. Captura, la IA transforma y tus invitados descargan por QR. Funciona sin internet y sin instalación.",
  openGraph: {
    title: "Birdcam — Photobooth con IA para tus eventos",
    description:
      "Cabinas de fotos con IA, listas en 2 minutos. Captura, la IA transforma y tus invitados descargan por QR.",
    type: "website",
    locale: "es_MX",
  },
  twitter: {
    card: "summary_large_image",
    title: "Birdcam — Photobooth con IA",
    description:
      "Cabinas de fotos con IA, listas en 2 minutos. Sin instalación y funciona sin internet.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="dark scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div aria-hidden className="bg-grid pointer-events-none fixed inset-0 z-0" />
        <div aria-hidden className="bg-noise pointer-events-none fixed inset-0 z-0" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}