import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function SparklesIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" {...stroke} {...props}>
      <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z" />
      <path d="M19 14.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z" />
      <path d="M5 16l.7 1.6L7.3 18.3l-1.6.7L5 20.6l-.7-1.6-1.6-.7 1.6-.7L5 16z" />
    </svg>
  );
}

export function WifiOffIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" {...stroke} {...props}>
      <path d="M2 8.5a15 15 0 0 1 20 0" />
      <path d="M5 12a11 11 0 0 1 14 0" />
      <path d="M8.5 15.5a6.5 6.5 0 0 1 7 0" />
      <circle cx="12" cy="19" r="0.5" fill="currentColor" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

export function QrIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" {...stroke} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3z" />
      <path d="M21 14v3" />
      <path d="M14 21h3" />
      <path d="M21 20v1" />
    </svg>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" {...stroke} {...props}>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
      <path d="M3 17l9 5 9-5" />
    </svg>
  );
}

export function TemplateIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" {...stroke} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 9v12" />
      <path d="M9 14h5" />
    </svg>
  );
}

export function ZapIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" {...stroke} {...props}>
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" {...stroke} {...props}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" {...stroke} {...props}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" {...stroke} {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" {...stroke} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" {...stroke} {...props}>
      <path d="M7 5l12 7-12 7V5z" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" {...stroke} {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" {...stroke} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" {...stroke} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function TikTokIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
      <path d="M16.6 3c.35 1.7 1.55 3.06 3.4 3.35v2.5a6.4 6.4 0 0 1-3.4-1v6.4A5.75 5.75 0 1 1 10.85 8.5v2.6a3.1 3.1 0 1 0 2.35 3V3h3.4z" />
    </svg>
  );
}

export function YouTubeIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
      <path d="M23 12s0-3.5-.45-5.2a2.75 2.75 0 0 0-1.94-1.94C18.9 4.4 12 4.4 12 4.4s-6.9 0-8.61.46A2.75 2.75 0 0 0 1.45 6.8C1 8.5 1 12 1 12s0 3.5.45 5.2a2.75 2.75 0 0 0 1.94 1.94c1.71.46 8.61.46 8.61.46s6.9 0 8.61-.46a2.75 2.75 0 0 0 1.94-1.94C23 15.5 23 12 23 12zM9.75 15.5v-7l6 3.5-6 3.5z" />
    </svg>
  );
}

export function XSocialIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
      <path d="M18.9 3h3.2l-7 8 8.2 10h-6.4l-5-6.5L5.9 21H2.7l7.5-8.6L2.3 3h6.6l4.5 5.9L18.9 3zm-1.1 16h1.8L7.7 4.8H5.8L17.8 19z" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" {...stroke} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" {...stroke} {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" {...stroke} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" {...stroke} {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}