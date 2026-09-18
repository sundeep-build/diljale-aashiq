import { ImageResponse } from "next/og";

/** Shared by every opengraph-image under /prompts, so share cards match. */
export const OG_SIZE = { width: 1200, height: 630 };

export function promptOgImage({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          // the studio aurora from studio.css, flattened for satori
          background:
            "radial-gradient(700px 380px at 15% -10%, rgba(139,92,246,0.45), transparent 70%), radial-gradient(620px 340px at 70% -10%, rgba(236,72,153,0.3), transparent 70%), #09090b",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: 8, textTransform: "uppercase", color: "#f0abfc" }}>
          {eyebrow}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: title.length > 40 ? 68 : 84, fontWeight: 800, lineHeight: 1.02 }}>
            {title}
          </div>
          <div style={{ fontSize: 32, color: "#a1a1aa", lineHeight: 1.3 }}>{subtitle}</div>
        </div>

        {/* satori needs a single text child per node — keep these interpolated */}
        <div style={{ fontSize: 24, color: "#c4b5fd", fontWeight: 700 }}>
          {"AI Prompts · Diljale Aashiq"}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
