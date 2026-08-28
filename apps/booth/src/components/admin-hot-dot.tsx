import { useCallback, useRef, useState } from "react";
import { invoke } from "@/lib/tauri";

const HOLD_DURATION = 3000;

export function AdminHotDot() {
  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const emit = useCallback(async () => {
    try {
      await invoke("emit_admin_unlock");
    } catch {
      // Fallback: dispatch custom event
      window.dispatchEvent(new CustomEvent("admin-hotdot"));
    }
  }, []);

  const startHold = useCallback(() => {
    setPressing(true);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / HOLD_DURATION) * 100);
      setProgress(pct);
    }, 16);

    timerRef.current = setTimeout(() => {
      setPressing(false);
      setProgress(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      void emit();
    }, HOLD_DURATION);
  }, [emit]);

  const cancelHold = useCallback(() => {
    setPressing(false);
    setProgress(0);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  return (
    <button
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed right-2 top-2 z-40 flex h-4 w-4 items-center justify-center group"
      title=""
      aria-label="Panel de administración"
    >
      <span
        className={`block rounded-full transition-all duration-300 ${
          pressing
            ? "h-3 w-3 bg-white/30"
            : "h-1.5 w-1.5 bg-white/10 group-hover:bg-white/20"
        }`}
      />
      {pressing && (
        <svg className="absolute h-4 w-4 -rotate-90" viewBox="0 0 16 16">
          <circle
            cx="8"
            cy="8"
            r="7"
            fill="none"
            stroke="rgba(167,139,250,0.5)"
            strokeWidth="2"
            strokeDasharray={`${progress * 0.44} 44`}
          />
        </svg>
      )}
    </button>
  );
}
