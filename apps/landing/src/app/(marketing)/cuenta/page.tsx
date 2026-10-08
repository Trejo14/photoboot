import type { Metadata } from "next";
import { AccountPanel } from "@/components/account-panel";

export const metadata: Metadata = {
  title: "Mi cuenta",
  description: "Inicia sesión para ver tu plan y tu ID de membresía Birdcam.",
  robots: { index: false, follow: false },
};

export default function CuentaPage() {
  return (
    <section className="relative pb-24 pt-32 lg:pb-32 lg:pt-40">
      <div className="mx-auto max-w-md px-5 lg:px-8">
        <AccountPanel />
      </div>
    </section>
  );
}
