import Image from "next/image";
import { cn } from "@photobooth/ui";

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-badge.png"
      alt="Birdcam"
      width={64}
      height={64}
      className={cn("rounded-lg", className)}
    />
  );
}
