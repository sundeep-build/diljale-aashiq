import { cx } from "@/lib/utils";

/**
 * The rainy 2am street the whole station sits on — the album cover, rebuilt in
 * CSS and one inline SVG. No image files, so it costs nothing to serve and
 * never blocks paint.
 *
 * Rain is four depth layers of transform/opacity animation rather than a
 * canvas: it composites on the GPU, so it is effectively free on a phone, and
 * `prefers-reduced-motion` stops it dead via the global rule in globals.css.
 *
 * Performance rule for everything in this file: an animated element may only
 * change `transform` and `opacity`, and it must not sit inside a `filter` or
 * `backdrop-filter`. Both of those force the browser off the compositor and
 * back into re-rasterising the whole subtree every frame, which is what used
 * to make this scene lock up a mid-range phone.
 *
 * Density scales with the screen. A phone gets the sky, the skyline and one
 * sheet of rain; the deeper layers are `hidden sm:block` so they cost nothing
 * at all on small screens — no elements, no animations, no layers.
 */
export function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* base wash — colder and darker than before, like the cover */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_-10%,#3a1e0c_0%,#170f07_42%,#080503_100%)]" />

      {/* Storm clouds rolling behind the skyline. Blur radii are down from
          130-140px: the blur is rasterised once, but a softer one over this
          much area is still real memory on a phone, and at this scale the
          difference is invisible. */}
      <div className="weather animate-drift absolute -left-40 -top-24 h-[30rem] w-[38rem] rounded-full bg-[#5a3010]/30 blur-[100px]" />
      <div
        className="weather animate-drift absolute -right-32 top-4 h-[26rem] w-[34rem] rounded-full bg-[#2b1c0c]/40 blur-[100px]"
        style={{ animationDelay: "-5s" }}
      />
      <div
        className="weather animate-drift absolute right-10 top-1/3 hidden h-[20rem] w-[20rem] rounded-full bg-amber/12 blur-[90px] sm:block"
        style={{ animationDelay: "-9s" }}
      />

      <Scene />
      <Rain />

      {/* wet-street sheen along the bottom */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_top,rgba(200,56,26,0.10),transparent)]" />

      <Splashes />

      {/* vignette, heavier than before so the middle reads as a spotlight */}
      <div className="absolute inset-0 bg-[radial-gradient(105%_105%_at_50%_38%,transparent_28%,rgba(0,0,0,0.82)_100%)]" />

      {/* the lens the whole scene is being watched through */}
      <GlassDrops />
    </div>
  );
}

/* ------------------------------------------------------------- rain --- */

/** the wind, in degrees off vertical — every rain layer is tilted by it */
const WIND = 15;

/**
 * Depth is what sells rain, so it is built back-to-front:
 * distant drizzle → mid drops → the few near drops you can actually watch.
 * Everything is one seeded shuffle, so the server and the client lay the
 * drops out identically and hydration stays quiet.
 */
function Rain() {
  return (
    <div className="weather absolute inset-0 overflow-hidden">
      {/* far: a haze of streaks, too small to resolve as individual drops */}
      <Curtain opacity={0.09} gap={22} len={22} thick={1} speed={112} className="hidden sm:block" />
      <Curtain opacity={0.14} gap={46} len={34} thick={1} speed={195} />
      {/* near-ish sheet, sparser and softer so it reads as past the focal plane */}
      <Curtain opacity={0.09} gap={92} len={58} thick={2} speed={315} className="hidden sm:block" />

      {/* Only the nearest drops survive on a phone. Each drop is its own
          composited layer, so the count is GPU memory as much as it is CPU. */}
      <DropField count={9} depth={0} className="hidden sm:block" />
      <DropField count={7} depth={1} className="hidden sm:block" />
      <DropField count={5} depth={2} />
    </div>
  );
}

/**
 * A sheet of dashed streaks. The dashes come from a mask rather than a second
 * gradient so the whole thing stays one paint, and the element travels exactly
 * one pattern tile per cycle — that is what makes the loop seamless.
 */
export function Curtain({
  opacity,
  gap,
  len,
  thick,
  speed,
  className,
}: {
  opacity: number;
  gap: number;
  len: number;
  thick: number;
  speed: number; // px per second, straight down
  className?: string;
}) {
  const tile = len + Math.round(len * 0.9);
  const fade = "linear-gradient(to bottom, transparent, black 16%, black 74%, transparent)";
  const dashes = `repeating-linear-gradient(to bottom,
    transparent 0 ${tile - len}px,
    black ${tile - len}px ${tile}px)`;

  return (
    <div
      className={cx("absolute inset-0", className)}
      style={{ opacity, maskImage: fade, WebkitMaskImage: fade }}
    >
      {/* The distant sheets used to carry a `filter: blur()` here. A filter on
          an ancestor pins the animating child to the CPU raster path — the
          blur has to be recomputed for every frame of the fall — and at 0.7px
          it was doing that for an effect nobody can see. Depth now comes from
          opacity and streak spacing alone, which composites. */}
      <div className="absolute -inset-[40%]" style={{ transform: `rotate(${WIND}deg)` }}>
        <div
          className="h-[200%] w-full"
          style={{
            ["--tile" as string]: `${tile}px`,
            animation: `rain ${(tile / speed).toFixed(3)}s linear infinite`,
            backgroundImage: `repeating-linear-gradient(to right,
              transparent 0 ${gap}px,
              rgba(233,240,255,0.9) ${gap}px ${gap + thick}px)`,
            maskImage: dashes,
            WebkitMaskImage: dashes,
          }}
        />
      </div>
    </div>
  );
}

/** [drop width px, length px, fall seconds, opacity] per depth */
const DEPTHS: [number, number, number, number][] = [
  [1.5, 12, 6.9, 0.3],
  [2, 20, 5.6, 0.5],
  [3, 34, 4.3, 0.8],
];

/**
 * Individual drops, the part the curtain cannot fake. Each one accelerates
 * (ease-in, because gravity) and stretches as it goes — a real drop shot at
 * speed smears vertically, and without that they read as sliding sticks.
 *
 * The depth-of-field blur that used to wrap this layer is gone for the same
 * reason as the curtains': a `filter` ancestor makes every frame of every
 * drop a fresh rasterisation instead of a compositor transform. Distance is
 * carried by the per-depth opacity instead.
 */
function DropField({
  count,
  depth,
  className,
}: {
  count: number;
  depth: number;
  className?: string;
}) {
  const [w, len, secs, fade] = DEPTHS[depth];
  const rand = seeded(depth * 977 + 31);
  // only the near layer is big enough for the glow to register
  const near = depth === 2;

  return (
    <div
      className={cx("absolute -inset-[30%]", className)}
      style={{ transform: `rotate(${WIND}deg)` }}
    >
      {Array.from({ length: count }, (_, i) => {
        const dur = secs * (0.82 + rand() * 0.36);
        return (
          <span
            key={i}
            className="absolute top-0 block"
            style={{
              // biased right of centre: the wind drags every drop leftward as
              // it falls, so drops seeded off the right edge still sweep in
              left: `${(15 + rand() * 95).toFixed(2)}%`,
              width: w,
              height: len,
              ["--fade" as string]: fade,
              animation: `rain-fall ${dur.toFixed(2)}s cubic-bezier(0.45,0.05,0.75,0.4) infinite`,
              animationDelay: `-${(rand() * dur).toFixed(2)}s`,
              borderRadius: "50% 50% 50% 50% / 12% 12% 88% 88%",
              background: `linear-gradient(to bottom,
                rgba(214,232,255,0) 0%,
                rgba(220,236,255,0.3) 42%,
                rgba(240,248,255,0.95) 86%,
                rgba(255,255,255,1) 100%)`,
              // the drop is a lens: it picks up the neon it falls past. Two
              // blurred shadows on a 1.5px far drop is pure paint cost for
              // something sub-pixel, so only the near layer carries one.
              boxShadow: near
                ? `0 0 ${w * 3}px rgba(200,225,255,0.4), 0 ${len * 0.2}px ${w * 4}px rgba(200,56,26,0.20)`
                : undefined,
              // Promotion is not free — it is a GPU texture per drop. Worth it
              // for the near layer you actually watch, wasteful for the haze.
              willChange: near ? "transform" : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

/** where the rain lands: a ring spreading on the road plus the crown it kicks up */
function Splashes() {
  const rand = seeded(613);

  return (
    <div className="weather absolute inset-x-0 bottom-0 h-40 overflow-hidden">
      {Array.from({ length: 5 }, (_, i) => {
        const dur = 3.4 + rand() * 2.9;
        const size = 16 + rand() * 26;
        const timing = { animationDelay: `-${(rand() * dur).toFixed(2)}s` };
        return (
          <div
            key={i}
            className="absolute"
            style={{ left: `${(rand() * 96).toFixed(2)}%`, bottom: `${(rand() * 22).toFixed(1)}%` }}
          >
            <div
              style={{
                width: size,
                height: size * 0.34,
                borderRadius: "50%",
                border: "1px solid rgba(233,240,255,0.45)",
                boxShadow: "0 0 8px rgba(200,56,26,0.28)",
                // resting state, for when reduced-motion cancels the animation
                opacity: 0,
                animation: `splash ${dur.toFixed(2)}s ease-out infinite`,
                ...timing,
              }}
            />
            <div
              className="absolute left-1/2 top-0 -ml-[1.5px] h-[3px] w-[3px] rounded-full bg-cream/70"
              style={{
                opacity: 0,
                animation: `splash-back ${dur.toFixed(2)}s ease-out infinite`,
                ...timing,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * The slow-motion beat: fat drops on the glass between you and the street.
 * Each one beads up, hangs on surface tension, slips, catches, then finally
 * lets go and runs — dragging a wet trail whose bottom edge tracks it exactly
 * (the mover's height *is* the trail's height, so the shared percentages in
 * `drop-cling` and `drop-trail` line up).
 *
 * Desktop only, and no longer a `backdrop-filter`. A backdrop filter on a
 * *moving* element is the worst case there is: the compositor has to re-read
 * the region behind it and re-blur it on every frame, for every drop, and the
 * region behind it is the rain. At 1.4px the blur was doing almost nothing
 * visible anyway — the radial highlight and the inset shadows are what make
 * the bead read as water, and those are a one-time paint.
 */
function GlassDrops() {
  const rand = seeded(2081);

  return (
    <div className="weather absolute inset-0 hidden overflow-hidden md:block">
      {Array.from({ length: 5 }, (_, i) => {
        const size = 9 + rand() * 13;
        const travel = 26 + rand() * 30; // vh
        const dur = 12 + rand() * 12;
        const timing = {
          animationDuration: `${dur.toFixed(2)}s`,
          animationDelay: `-${(rand() * dur).toFixed(2)}s`,
          animationIterationCount: "infinite" as const,
        };
        return (
          <div
            key={i}
            className="absolute"
            style={{ left: `${(4 + rand() * 90).toFixed(2)}%`, top: `${(rand() * 34).toFixed(2)}%` }}
          >
            {/* The wet streak left behind. Centred with `left`, not a
                translate — the keyframes own `transform`, and a Tailwind
                -translate-x-1/2 would be wiped the moment they run. */}
            <div
              className="absolute top-0 origin-top"
              style={{
                left: size * 0.3,
                width: size * 0.4,
                height: `${travel}vh`,
                borderRadius: 999,
                background:
                  "linear-gradient(to bottom, rgba(233,240,255,0) 0%, rgba(233,240,255,0.05) 35%, rgba(233,240,255,0.16) 100%)",
                filter: "blur(0.6px)",
                // resting state: no trail, just a bead on the glass
                transform: "scaleY(0)",
                animationName: "drop-trail",
                animationTimingFunction: "cubic-bezier(0.5,0,0.6,1)",
                ...timing,
              }}
            />
            {/* the mover — height equals the travel, so its % translates map
                one-to-one onto the trail's scaleY */}
            <div
              className="absolute left-0 top-0 origin-top"
              style={{
                width: size,
                height: `${travel}vh`,
                animationName: "drop-cling",
                animationTimingFunction: "cubic-bezier(0.5,0,0.6,1)",
                willChange: "transform",
                ...timing,
              }}
            >
              <div
                className="relative"
                style={{
                  width: size,
                  height: size * 1.18,
                  borderRadius: "52% 48% 44% 56% / 58% 54% 46% 42%",
                  // slightly brighter stops than before, to stand in for the
                  // `brightness(1.12)` the backdrop filter used to contribute
                  background: `radial-gradient(58% 52% at 36% 30%,
                    rgba(255,255,255,0.82) 0%,
                    rgba(226,238,255,0.28) 46%,
                    rgba(150,175,210,0.14) 72%,
                    rgba(255,255,255,0.08) 100%)`,
                  boxShadow: `inset -1px -2px 4px rgba(255,255,255,0.35),
                    inset 2px 3px 5px rgba(200,56,26,0.18),
                    0 2px 7px rgba(0,0,0,0.4)`,
                }}
              >
                {/* specular pin — the single highlight that makes it read as water */}
                <div className="absolute left-[24%] top-[16%] h-[24%] w-[28%] rounded-full bg-white/70 blur-[0.5px]" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Tiny LCG. The layouts have to be random-looking but identical on the server
 * and in the browser, so `Math.random` is out — this is seeded and pure.
 */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** skyline · graffiti wall · the seated figure · the tapri */
function Scene() {
  return (
    <svg
      className="absolute inset-x-0 bottom-0 h-[42vh] w-full min-w-[46rem]"
      viewBox="0 0 1200 320"
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <linearGradient id="bd-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2c1d0d" />
          <stop offset="100%" stopColor="#100a05" />
        </linearGradient>
        <linearGradient id="bd-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#251a0e" />
          <stop offset="100%" stopColor="#0d0805" />
        </linearGradient>
        <linearGradient id="bd-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b1309" />
          <stop offset="100%" stopColor="#080503" />
        </linearGradient>
      </defs>

      {/* far buildings */}
      <g fill="url(#bd-far)">
        <rect x="20" y="150" width="90" height="180" />
        <rect x="130" y="110" width="70" height="220" />
        <rect x="215" y="170" width="110" height="160" />
        <rect x="345" y="95" width="60" height="235" />
        <rect x="425" y="145" width="95" height="185" />
        <rect x="985" y="125" width="80" height="205" />
        <rect x="1085" y="165" width="105" height="165" />
      </g>

      {/* lit windows */}
      <g fill="#ffbe6b" opacity="0.45">
        {WINDOWS.map(([x, y, o], i) => (
          <rect key={i} x={x} y={y} width="6" height="9" opacity={o} rx="1" />
        ))}
      </g>

      {/* ---- the wall, with the dripping broken heart ---- */}
      <g>
        <rect x="548" y="86" width="197" height="244" fill="url(#bd-wall)" />
        <rect x="548" y="86" width="197" height="4" fill="#3a2411" opacity="0.7" />

        {/* graffiti heart, split down the middle, paint running off it */}
        <g transform="translate(640 150)" opacity="0.5">
          <path
            d="M0 30S-22 15-28 2A11 11 0 0 1-0.5-8 11 11 0 0 1 28 2C22 15 0 30 0 30Z"
            fill="#b0311a"
          />
          <path d="M0 -8 -7 8l10 5.5-8 12" stroke="#0d0805" strokeWidth="3.4"
            strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {[[-13, 26, 20], [4, 30, 30], [15, 24, 14]].map(([x, y, len], i) => (
            <rect key={i} x={x} y={y} width="2.4" height={len} rx="1.2" fill="#b0311a"
              opacity={0.75 - i * 0.15} />
          ))}
        </g>
      </g>

      {/* ---- the aashiq, sitting on the ground against the wall ---- */}
      {/* built from round-capped strokes rather than outlines: limbs stay the
          right thickness and the joints meet cleanly at any scale */}
      <g
        stroke="#080503"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M737 296 L729 242" strokeWidth="23" />
        <path d="M737 296 L776 268" strokeWidth="19" />
        <path d="M776 268 L781 295" strokeWidth="15" />
        <path d="M733 250 L771 267" strokeWidth="11" />
        <path d="M781 297 L795 297" strokeWidth="9" />
      </g>
      <g fill="#080503">
        {/* head, tipped back toward the rain */}
        <circle cx="727" cy="226" r="12" />
        <path d="M716 222c1-9 8-14 15-12 5 1 8 5 8 9-5-3-11-3-16-1-3 1-5 2-7 4Z" />
      </g>

      {/* reflection in the wet ground */}
      <g
        stroke="#080503"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.22"
        transform="translate(0 600) scale(1 -1)"
      >
        <path d="M737 296 L729 250" strokeWidth="23" />
        <path d="M737 296 L776 268" strokeWidth="19" />
        <path d="M776 268 L781 295" strokeWidth="15" />
      </g>

      {/* ---- the tapri, further down the street ---- */}
      <g opacity="0.9">
        <rect x="840" y="212" width="180" height="118" fill="url(#bd-near)" />
        <rect x="828" y="204" width="204" height="14" rx="4" fill="#3a2411" />
        {Array.from({ length: 7 }).map((_, i) => (
          <rect key={i} x={830 + i * 28} y="204" width="14" height="14" fill="#c8381a"
            opacity="0.5" />
        ))}
        <rect x="882" y="248" width="52" height="82" fill="#080503" />
        <rect x="960" y="244" width="42" height="32" rx="3" fill="#ffbe6b" opacity="0.24" />
        <line x1="930" y1="204" x2="930" y2="232" stroke="#3a2411" strokeWidth="2" />
        <circle cx="930" cy="236" r="5" fill="#ffd9a0" className="animate-flicker" />
        <circle cx="930" cy="236" r="20" fill="#ffbe6b" opacity="0.12"
          className="animate-flicker" />
      </g>

      {/* wet road, with a smear of light across it */}
      <rect x="0" y="300" width="1200" height="20" fill="#080503" />
      <rect x="0" y="302" width="1200" height="3" fill="#c8381a" opacity="0.12" />
    </svg>
  );
}

/** [x, y, opacity] — hand-scattered so the skyline doesn't look generated */
const WINDOWS: [number, number, number][] = [
  [34, 166, 0.9], [52, 166, 0.3], [70, 190, 0.7], [34, 214, 0.4], [88, 166, 0.6],
  [144, 126, 0.8], [162, 126, 0.35], [144, 152, 0.55], [180, 178, 0.9], [162, 204, 0.4],
  [232, 186, 0.7], [252, 186, 0.3], [286, 210, 0.8], [232, 234, 0.45], [304, 186, 0.6],
  [358, 112, 0.85], [376, 138, 0.5], [358, 164, 0.7], [376, 190, 0.3],
  [440, 162, 0.6], [462, 162, 0.85], [440, 190, 0.35], [492, 214, 0.7],
  [1000, 142, 0.6], [1022, 168, 0.85], [1000, 194, 0.4], [1040, 142, 0.3],
  [1100, 182, 0.7], [1124, 182, 0.4], [1100, 210, 0.6], [1160, 238, 0.35],
];
