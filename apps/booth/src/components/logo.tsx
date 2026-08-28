interface Props {
  size?: string;
  className?: string;
}

export function LogoBirdcam({ size = "10", className = "" }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={`animate-logo-enter ${className}`}
    >
      <defs>
        <linearGradient
          id="birdcam-g"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="0.5" stopColor="#f472b6" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect
        width="32"
        height="32"
        rx="8"
        fill="currentColor"
        opacity="0.08"
      />
      <path
        d="M7 17h4.5l3-5 5 11 3.5-6H25"
        fill="none"
        stroke="url(#birdcam-g)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
