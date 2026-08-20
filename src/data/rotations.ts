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
    from: "#c8381a",
    to: "#5e1a0b",
  },
  {
    slug: "raat",
    name: "Raat 2 Baje",
    deva: "रात २ बजे",
    blurb: "Slowed, reverbed, and far too honest for daylight.",
    from: "#6f8ba3",
    to: "#22303c",
  },
  {
    slug: "lofi",
    name: "Lofi Dard",
    deva: "लोफ़ाई दर्द",
    blurb: "Same wounds, softer tape hiss. For studying or staring at the fan.",
    from: "#e8c06a",
    to: "#6b4a1e",
  },
  {
    slug: "vichoda",
    name: "Punjabi Vichoda",
    deva: "विछोड़ा",
    blurb: "B Praak sized heartbreak. Volume up, phone face down.",
    from: "#84a389",
    to: "#2c4232",
  },
  {
    slug: "sufi",
    name: "Sufi Tanhai",
    deva: "तन्हाई",
    blurb: "Kailash, Rahat, and the kind of longing that isn't only romantic.",
    from: "#c2622c",
    to: "#6b3315",
  },
  {
    slug: "zakhm",
    name: "Naye Zakhm",
    deva: "नए ज़ख़्म",
    blurb: "AUR, Asim, Arshman. Heartbreak that still has unread messages.",
    from: "#b5566b",
    to: "#4a1b26",
  },
];

/**
 * The rotation accent, lifted toward the cream.
 *
 * `from` is tuned to work as a saturated fill — a tile, a dard bar, the glow
 * under the artwork — and it is too dark at one end of the set for anything
 * involving glyphs. The signboard red lands near 3.7:1 against the page's ink
 * as text, and near 3.7:1 the other way round when ink is set on top of it,
 * both short of the 4.5:1 these 10-12px labels need. One mix solves both:
 * lifted, the accent clears 7:1 as text on ink and 7:1 as a bed under it.
 *
 * Use it wherever the accent meets a glyph. Use raw `from` for shapes.
 */
export function liftedAccent(from: string) {
  return `color-mix(in oklab, ${from} 62%, var(--color-cream))`;
}

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
