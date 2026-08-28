export function AuthHeroPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-[#0a0a0f] md:flex md:items-center md:justify-center">
      <div className="absolute inset-0">
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-blob hero-blob-3" />
        <div className="hero-flash hero-flash-1" />
        <div className="hero-flash hero-flash-2" />
        <div className="hero-flash hero-flash-3" />
        <div className="hero-confetti hero-confetti-1" />
        <div className="hero-confetti hero-confetti-2" />
        <div className="hero-confetti hero-confetti-3" />
        <div className="hero-confetti hero-confetti-4" />
        <div className="hero-confetti hero-confetti-5" />
        <div className="hero-confetti hero-confetti-6" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-6 px-12 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 120 120"
          className="h-24 w-24 animate-pulse-glow"
        >
          <defs>
            <linearGradient id="hero-g" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#a78bfa" />
              <stop offset="0.5" stopColor="#f472b6" />
              <stop offset="1" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <rect width="120" height="120" rx="24" fill="url(#hero-g)" opacity="0.15" />
          <rect x="30" y="25" width="60" height="70" rx="8" fill="none" stroke="url(#hero-g)" strokeWidth="3" />
          <circle cx="60" cy="52" r="14" fill="none" stroke="url(#hero-g)" strokeWidth="2.5" />
          <rect x="42" y="75" width="36" height="6" rx="3" fill="url(#hero-g)" opacity="0.5" />
          <circle cx="78" cy="35" r="5" fill="#f472b6" opacity="0.8" />
        </svg>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold gradient-birdcam-text">
            Tu photobooth profesional
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Captura, comparte y sorprende a tus invitados con fotos increíbles.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="hero-frame" />
          <div className="hero-frame hero-frame-delayed" />
        </div>
      </div>
    </div>
  );
}
