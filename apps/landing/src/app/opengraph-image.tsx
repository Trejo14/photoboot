import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a10",
          backgroundImage:
            "radial-gradient(circle at 25% 15%, rgba(56,189,248,0.35), transparent 45%), radial-gradient(circle at 80% 85%, rgba(34,211,238,0.25), transparent 45%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 76,
              height: 76,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.06)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
              <path
                d="M7 17h4.5l3-5 5 11 3.5-6H25"
                stroke="#38bdf8"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span style={{ fontSize: 44, fontWeight: 700, color: "white", letterSpacing: -1 }}>
            BIRDCAM
          </span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 58,
            fontWeight: 700,
            color: "white",
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: 920,
          }}
        >
          Cabinas de fotos con IA, listas en 2 minutos
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 26,
            fontSize: 28,
            color: "#9b9ba8",
          }}
        >
          Captura · La IA transforma · Entrega por QR
        </div>
      </div>
    ),
    { ...size }
  );
}
