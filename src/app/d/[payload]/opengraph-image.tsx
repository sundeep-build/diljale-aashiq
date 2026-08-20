import { ImageResponse } from "next/og";
import { decodeDedication } from "@/lib/dedication";
import { ROTATION_BY_SLUG } from "@/data/rotations";

/**
 * The WhatsApp/Instagram preview for a shared dedication, rendered on the fly.
 * next/og is bundled with Next and runs inside the normal function budget —
 * no image service, no extra bill.
 *
 * Kept to Latin script on purpose: ImageResponse ships a Latin-only default
 * font, so Devanagari would render as boxes.
 */
export const alt = "Ek gaana tumhare naam — Diljale Aashiq";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ payload: string }>;
}) {
  const { payload } = await params;
  const d = decodeDedication(payload);

  const accent = d ? ROTATION_BY_SLUG[d.track.rotation].from : "#c8381a";
  const to = d?.to ?? "Tumhare liye";
  const note = d?.note ?? "Ye gaana sun lena.";
  const from = d?.from?.trim();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
          overflow: "hidden",
          background: `radial-gradient(1000px 520px at 15% -10%, ${accent}55 0%, #170f07 45%, #0c0904 100%)`,
          color: "#f2e4c9",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              background: accent,
            }}
          />
          <div
            style={{
              fontSize: 22,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "#a3866a",
            }}
          >
            Diljale Aashiq · Dedication
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 26, color: "#a3866a", letterSpacing: 6 }}>
            YE GAANA
          </div>
          <div
            style={{
              fontSize: to.length > 14 ? 72 : 96,
              fontWeight: 800,
              lineHeight: 1,
              color: accent,
            }}
          >
            {to}
          </div>
          <div style={{ fontSize: 26, color: "#a3866a", letterSpacing: 6 }}>
            KE NAAM
          </div>
          <div
            style={{
              marginTop: 14,
              fontSize: 31,
              lineHeight: 1.32,
              color: "#f2e4c9dd",
              maxWidth: 940,
            }}
          >
            {`“${note.length > 120 ? `${note.slice(0, 118)}…` : note}”`}
          </div>
          {from && (
            <div style={{ marginTop: 6, fontSize: 26, color: "#a3866a" }}>
              {`— ${from}`}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {d && (
            <img
              src={d.track.art}
              alt=""
              width={104}
              height={104}
              style={{ borderRadius: 20, objectFit: "cover" }}
            />
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 700 }}>
              {d?.track.title ?? "Diljale Aashiq"}
            </div>
            <div style={{ fontSize: 24, color: "#a3866a" }}>
              {d?.track.artists ?? "24×7 dard ka radio"}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
