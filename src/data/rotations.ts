import type { RotationSlug } from "./tracks";

export type Rotation = {
  slug: RotationSlug;
  name: string;
  deva: string;
  blurb: string;
  /** two-stop gradient used for the tile + the now-playing glow */
  from: string;
  to: string;
};

export const ROTATIONS: Rotation[] = [
  {
    slug: "judaai",
    name: "Judaai Classics",
    deva: "जुदाई",
    blurb: "Arijit, Ankit, Mithoon. The songs that ruined a whole generation.",
    from: "#ff2f5e",
    to: "#7b1e46",
  },
  {
    slug: "raat",
    name: "Raat 2 Baje",
    deva: "रात २ बजे",
    blurb: "Slowed, reverbed, and far too honest for daylight.",
    from: "#6a5cff",
    to: "#1d1440",
  },
  {
    slug: "lofi",
    name: "Lofi Dard",
    deva: "लोफ़ाई दर्द",
    blurb: "Same wounds, softer tape hiss. For studying or staring at the fan.",
    from: "#ffbe6b",
    to: "#7a3f16",
  },
  {
    slug: "vichoda",
    name: "Punjabi Vichoda",
    deva: "विछोड़ा",
    blurb: "B Praak sized heartbreak. Volume up, phone face down.",
    from: "#00d5b0",
    to: "#0c4a45",
  },
  {
    slug: "sufi",
    name: "Sufi Tanhai",
    deva: "तन्हाई",
    blurb: "Kailash, Rahat, and the kind of longing that isn't only romantic.",
    from: "#ff8a3d",
    to: "#6b2410",
  },
  {
    slug: "zakhm",
    name: "Naye Zakhm",
    deva: "नए ज़ख़्म",
    blurb: "AUR, Asim, Arshman. Heartbreak that still has unread messages.",
    from: "#ff5ecd",
    to: "#4a1050",
  },
];

export const ROTATION_BY_SLUG = Object.fromEntries(
  ROTATIONS.map((r) => [r.slug, r]),
) as Record<RotationSlug, Rotation>;

/** Copy shown on the Dard-o-Meter for each level of the dial. */
export const DARD_SCALE: { upto: number; label: string; deva: string }[] = [
  { upto: 2, label: "Bas thoda sa udaas", deva: "हल्का सा" },
  { upto: 4, label: "Purani yaadein aa rahi hain", deva: "यादें" },
  { upto: 6, label: "Dil thoda bhaari hai", deva: "भारी दिल" },
  { upto: 8, label: "Aansoo ruk nahi rahe", deva: "आँसू" },
  { upto: 10, label: "Poora tabaah. Tapri pe baith jao.", deva: "तबाह" },
];

export function dardCopy(level: number) {
  return DARD_SCALE.find((s) => level <= s.upto) ?? DARD_SCALE[DARD_SCALE.length - 1];
}
