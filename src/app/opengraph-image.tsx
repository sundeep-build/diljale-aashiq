import { ImageResponse } from "next/og";
import { TRACKS } from "@/data/tracks";

export const alt = "Diljale Aashiq — 24x7 dard ka radio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  // four covers, evenly spread through the playlist, as a mosaic strip
  const covers = [0, 13, 27, 41].map((i) => TRACKS[i]?.art).filter(Boolean) as string[];

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
          background:
            "radial-gradient(1100px 560px at 50% -15%, #3a1e0c 0%, #170f07 45%, #0c0904 100%)",
          color: "#f2e4c9",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: 9,
            textTransform: "uppercase",
            color: "#a3866a",
          }}
        >
          Jalandhar · Raat 2 baje · Non-stop
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              fontSize: 128,
              fontWeight: 800,
              lineHeight: 0.95,
              color: "#c8381a",
            }}
          >
            Diljale Aashiq
          </div>
          {/* satori needs a single text child per node — keep these interpolated */}
          <div style={{ fontSize: 40, color: "#f2e4c9cc" }}>
            {`24×7 dard ka radio · ${TRACKS.length} heartbreak songs`}
          </div>
          <div style={{ fontSize: 30, color: "#a3866a", marginTop: 8 }}>
            Playlist mat chuno. Dard chuno.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {covers.map((src) => (
            <img
              key={src}
              src={src}
              alt=""
              width={104}
              height={104}
              style={{ borderRadius: 18, objectFit: "cover" }}
            />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
