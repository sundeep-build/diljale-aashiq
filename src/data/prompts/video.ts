import type { Prompt } from "./types";

/**
 * Video-generation prompts. Written shot-first — subject, camera, motion,
 * light, sound — because that is the order every current video model weighs
 * a prompt in.
 */
export const VIDEO_PROMPTS: Prompt[] = [
  {
    slug: "rain-on-window-seamless-loop",
    category: "video",
    title: "Rain on a window, seamless loop",
    summary:
      "A calm, locked-off shot of rain running down a window at night — the classic lofi and study-music background.",
    prompt:
      "Locked-off close-up shot of a window at night with steady rain running down the glass, blurred warm city lights and a distant traffic signal glowing behind it, droplets gathering and sliding down in real time, a faint reflection of a desk lamp on the glass, no camera movement, calm and hypnotic, cinematic shallow depth of field. Audio: soft steady rain on glass, distant muffled traffic.",
    models: ["Veo", "Sora", "Kling", "Runway"],
    settings: {
      Duration: "8–10 s",
      "Aspect ratio": "16:9",
      Camera: "Static, locked-off",
      "Best for": "Lofi streams, study videos, music visualisers",
    },
    tags: ["loop", "rain", "lofi", "ambient", "background"],
    tips: [
      "'No camera movement' is essential for a loop — any drift makes the seam obvious.",
      "To loop it, crossfade the last second into the first in your editor; rain hides the join well.",
      "Models with native audio (like Veo) will add the rain sound from the 'Audio:' line. Others ignore it safely.",
    ],
    variations: [
      "Same shot in daylight, grey monsoon sky, a green tree swaying behind the glass",
      "Rain on a car windshield at a red light, wipers passing once every few seconds",
    ],
    added: "2026-09-18",
  },
  {
    slug: "drone-over-mustard-fields",
    category: "video",
    title: "Drone flight over mustard fields",
    summary:
      "A slow golden-hour aerial glide over yellow fields and a winding village road — an easy, high-impact establishing shot.",
    prompt:
      "Slow cinematic drone shot gliding forward low over endless yellow mustard fields in rural Punjab at golden hour, a narrow village road winding through the fields, a tractor moving slowly in the distance, flowers swaying gently in the breeze, sun low on the horizon creating lens flare and long shadows, light haze, smooth stabilised motion, rich natural colours",
    models: ["Veo", "Sora", "Kling", "Runway", "Luma"],
    settings: {
      Duration: "8 s",
      "Aspect ratio": "16:9",
      Camera: "Forward drone glide, slight descent",
      "Best for": "Intros, travel reels, music videos",
    },
    tags: ["drone", "aerial", "landscape", "golden hour", "india"],
    tips: [
      "Describe one camera move only. 'Glide forward' plus 'orbit' plus 'rise' in one short clip produces wobbly motion.",
      "'Slow' and 'smooth stabilised' reduce the jitter many models add to aerial shots.",
      "For a vertical reel, generate 9:16 directly rather than cropping — the composition changes.",
    ],
    added: "2026-09-17",
  },
  {
    slug: "train-window-passing-landscape",
    category: "video",
    title: "View from a moving train window",
    summary:
      "A nostalgic shot of countryside rushing past a train window, a hand resting on the sill — made for travel and sad-song edits.",
    prompt:
      "Shot from inside an Indian passenger train looking out through an open window with metal bars, green fields, telegraph poles and small villages rushing past from right to left, late afternoon sunlight flickering across the frame, a person's hand resting on the window sill, curtain fluttering in the wind, gentle rhythmic camera sway from the train's motion, nostalgic warm colours, 35mm film look. Audio: rhythmic clatter of train wheels, wind.",
    models: ["Veo", "Sora", "Kling", "Runway"],
    settings: {
      Duration: "8–10 s",
      "Aspect ratio": "16:9 or 9:16",
      Camera: "Handheld, following the train's sway",
      "Best for": "Travel reels, lyric videos, emotional edits",
    },
    tags: ["train", "travel", "nostalgic", "cinematic", "india"],
    tips: [
      "Stating the direction the landscape moves ('right to left') keeps the motion consistent through the clip.",
      "'Sunlight flickering across the frame' creates the strobing light of passing poles — it is what makes it feel real.",
      "Keep people to a hand or silhouette. Faces in fast-moving shots are where video models still slip.",
    ],
    variations: [
      "Same view at night, village lights passing as streaks, reflection of a phone screen in the glass",
      "Monsoon version: rain blowing in through the window, fields flooded and silver",
    ],
    added: "2026-09-16",
  },
  {
    slug: "chai-pour-slow-motion-macro",
    category: "video",
    title: "Slow-motion chai pour, macro",
    summary:
      "A mouth-watering slow-motion macro of chai being poured from height into a glass — perfect food-content b-roll.",
    prompt:
      "Extreme slow motion macro shot of hot milky chai being poured from a height out of a steel kettle into a small glass, a long arc of liquid catching warm light, froth forming on top, steam curling up, tiny droplets splashing, dark wooden counter, dark moody background with a warm rim light from behind, shallow depth of field, 120fps look, rich caramel tones",
    models: ["Veo", "Sora", "Kling", "Runway"],
    settings: {
      Duration: "5–8 s",
      "Aspect ratio": "9:16",
      Camera: "Static macro, slow motion",
      "Best for": "Café ads, food reels, product b-roll",
    },
    tags: ["food", "slow motion", "macro", "product", "b-roll"],
    tips: [
      "'Rim light from behind' is what makes the steam and the liquid arc visible against a dark background.",
      "Liquids are a strength of current video models — lean into splashes and froth rather than hands and faces.",
      "Swap in coffee, lassi or any drink; keep the lighting description identical.",
    ],
    added: "2026-09-15",
  },
  {
    slug: "neon-sign-flicker-in-rain",
    category: "video",
    title: "Flickering neon sign in the rain",
    summary:
      "A moody shot of a buzzing neon sign reflected in a puddle as rain falls — ideal for intros and music visualisers.",
    prompt:
      "Low-angle shot of a flickering red neon sign shaped like a broken heart above a closed shop shutter on a narrow street at night, heavy rain falling through the glow, the sign reflected in a rippling puddle in the foreground, the neon buzzing and stuttering off and on twice, wet brick wall, slow push-in towards the sign, cinematic, high contrast. Audio: rain, electrical buzz of the neon.",
    models: ["Veo", "Sora", "Kling", "Runway", "Luma"],
    settings: {
      Duration: "8 s",
      "Aspect ratio": "16:9",
      Camera: "Slow push-in, low angle",
      "Best for": "Channel intros, lyric video backgrounds",
    },
    tags: ["neon", "rain", "night", "moody", "intro"],
    tips: [
      "Describe the sign as a shape, not words. Generated text flickers and warps from frame to frame.",
      "'Stuttering off and on twice' gives the model a specific, countable action — vague 'flickering' often comes out as constant shimmer.",
      "The puddle reflection doubles the light in the frame for free; keep it in the foreground.",
    ],
    added: "2026-09-14",
  },
  {
    slug: "walking-alone-in-rain-single-shot",
    category: "video",
    title: "Walking alone in the rain, single shot",
    summary:
      "An emotional tracking shot of a person walking away down a wet street at night — the heartbreak music-video staple.",
    prompt:
      "Cinematic tracking shot following a young man from behind as he walks slowly down an empty wet street at night in heavy rain, no umbrella, hands in the pockets of a dark jacket, shoulders hunched, streetlights creating pools of amber light on the road, rain visible in the light beams, camera following at a steady distance on a gimbal, shallow depth of field, melancholic mood, teal and amber colour grade",
    models: ["Veo", "Sora", "Kling", "Runway"],
    settings: {
      Duration: "8–10 s",
      "Aspect ratio": "16:9",
      Camera: "Gimbal tracking from behind",
      "Best for": "Music videos, short films, sad edits",
    },
    tags: ["cinematic", "rain", "emotional", "music video", "night"],
    tips: [
      "Shooting from behind avoids face consistency problems entirely and reads as more emotional anyway.",
      "'Rain visible in the light beams' is how real cinematographers show rain — backlight, not front light.",
      "For a series of shots with the same person, reuse the exact clothing description in every prompt.",
    ],
    variations: [
      "Same walk, but the camera slowly rises into a high overhead shot as he gets smaller",
      "A young woman sitting alone at a bus stop in the rain, slow push-in, same colour grade",
    ],
    added: "2026-09-13",
  },
  {
    slug: "sneaker-360-turntable",
    category: "video",
    title: "Product 360° turntable",
    summary:
      "A clean studio spin of a product on a rotating pedestal — the fastest way to make e-commerce video without a shoot.",
    prompt:
      "Studio product video of a white leather sneaker rotating slowly 360 degrees on a matte cylindrical pedestal, soft gradient background from light beige to warm white, soft diffused key light and a subtle rim light, gentle reflection on the pedestal, camera static, smooth constant rotation speed, crisp detail on the stitching, premium commercial look",
    models: ["Veo", "Kling", "Runway", "Sora"],
    settings: {
      Duration: "6–8 s",
      "Aspect ratio": "1:1 or 4:5",
      Camera: "Static, product rotates",
      Input: "Optional: product photo as the first frame",
      "Best for": "Store listings, ads, social posts",
    },
    tags: ["product", "ecommerce", "studio", "3d", "marketing"],
    tips: [
      "Use your real product photo as the first frame (image-to-video) so the model does not invent details.",
      "'Camera static, product rotates' must be explicit — otherwise many models orbit the camera instead, which looks different.",
      "Pick the rotation that looks cleanest and trim to one full turn for a perfect loop.",
    ],
    added: "2026-09-12",
  },
  {
    slug: "city-skyline-day-to-night-timelapse",
    category: "video",
    title: "City skyline, day-to-night timelapse",
    summary:
      "A smooth timelapse of a city skyline as the sun sets and the lights come on — a dependable transition or intro shot.",
    prompt:
      "Timelapse of a dense Indian city skyline from a rooftop, transitioning smoothly from late afternoon to blue hour to night, clouds streaming quickly across the sky, the sun setting behind high-rise buildings, windows and streets lighting up one by one, traffic turning into light trails on a flyover in the foreground, locked-off camera, crisp detail, rich colour",
    models: ["Veo", "Sora", "Kling", "Runway", "Luma"],
    settings: {
      Duration: "8–10 s",
      "Aspect ratio": "16:9",
      Camera: "Locked-off timelapse",
      "Best for": "Intros, transitions, corporate videos",
    },
    tags: ["timelapse", "city", "night", "b-roll", "transition"],
    tips: [
      "List the stages of light in order ('late afternoon to blue hour to night') so the model knows it must pass through all of them.",
      "'Light trails' only look right with a locked-off camera — don't add camera movement to a timelapse.",
      "Name a specific city for recognisable landmarks, but expect them to be approximate.",
    ],
    added: "2026-09-11",
  },
  {
    slug: "cozy-anime-room-lofi-loop",
    category: "video",
    title: "Cozy anime-style room, lofi loop",
    summary:
      "A hand-drawn-style animation of a quiet room at night with a character studying by the window — built for music streams.",
    prompt:
      "2D hand-drawn anime-style animation of a small cozy bedroom at night, an original character with headphones writing in a notebook at a desk by an open window, a sleeping cat on the bed, rain falling outside, a string of warm fairy lights, a steaming cup of tea, gentle subtle motion only: pen moving, curtains swaying, rain, the cat breathing, soft warm and purple palette, calm atmosphere, static camera",
    models: ["Kling", "Veo", "Sora", "Runway"],
    settings: {
      Duration: "8–10 s",
      "Aspect ratio": "16:9",
      Camera: "Static",
      "Best for": "Lofi streams, music channels, YouTube backgrounds",
    },
    tags: ["anime", "lofi", "loop", "animation", "cozy"],
    tips: [
      "Listing exactly which things move ('pen, curtains, rain, the cat breathing') keeps the rest still — ideal for a loop.",
      "Use 'original character' and generic style words; naming a studio or an existing character risks copyright and usage-policy problems.",
      "Generate a still image first, then animate it with image-to-video for full control over the look.",
    ],
    added: "2026-09-10",
  },
  {
    slug: "burning-letter-macro",
    category: "video",
    title: "A handwritten letter burning, macro",
    summary:
      "An extreme close-up of an old letter slowly catching fire, edges curling into embers — a striking visual for sad songs and trailers.",
    prompt:
      "Extreme macro shot of the corner of an old handwritten letter on dark wood slowly catching fire, a thin line of orange ember creeping across the paper, edges curling and blackening, ink lines disappearing into ash, small sparks and wisps of smoke rising, dark background, warm light from the flame only, slow motion, very shallow depth of field. Audio: soft crackle of burning paper.",
    models: ["Veo", "Sora", "Kling", "Runway"],
    settings: {
      Duration: "8 s",
      "Aspect ratio": "16:9 or 9:16",
      Camera: "Static macro",
      "Best for": "Lyric videos, trailers, emotional reels",
    },
    tags: ["macro", "fire", "emotional", "slow motion", "cinematic"],
    tips: [
      "'Light from the flame only' keeps the frame dark and dramatic — adding other lights makes it look staged.",
      "Keep the handwriting unreadable; legible words will warp as the paper burns.",
      "Reverse the clip in your editor for an 'un-burning' effect that works well at the end of a video.",
    ],
    added: "2026-09-09",
  },
];
