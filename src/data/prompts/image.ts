import type { Prompt } from "./types";

/**
 * Image-generation prompts. Newest first is not required — the query layer
 * sorts by `added` — but keeping new entries at the top keeps diffs readable.
 */
export const IMAGE_PROMPTS: Prompt[] = [
  {
    slug: "rainy-night-roadside-dhaba",
    category: "image",
    title: "Rainy night at a roadside dhaba",
    summary:
      "A cinematic, rain-soaked highway dhaba under a flickering signboard — warm tungsten light against a cold wet night.",
    prompt:
      "Cinematic wide shot of a small roadside dhaba on a North Indian highway at 2 a.m. during heavy monsoon rain, a hand-painted signboard lit by a single bare bulb, steam rising from a large kettle on the counter, plastic chairs glistening with water, a lone truck parked in the background with its hazard lights on, puddles reflecting warm orange light, cold blue night beyond, shot on 35mm film, shallow depth of field, soft film grain, moody and quiet",
    negative:
      "text, watermark, logo, oversaturated, cartoon, extra people, blurry face, deformed hands",
    models: ["Midjourney", "Flux", "Stable Diffusion", "GPT Image"],
    settings: {
      "Aspect ratio": "16:9",
      Style: "Photographic, cinematic",
      "Best for": "Wallpapers, music covers, blog headers",
    },
    tags: ["cinematic", "rain", "night", "india", "moody"],
    tips: [
      "The single bare bulb is doing the heavy lifting. Keep it one light source — adding 'neon' or 'string lights' flattens the mood.",
      "Swap '35mm film' for 'anamorphic lens, horizontal lens flare' for a more movie-poster look.",
      "If the signboard comes out with garbled lettering, add 'signboard with no readable text' rather than trying to spell a name.",
    ],
    variations: [
      "Same dhaba at dawn after the rain, wet road, pale pink sky, steam from chai glasses, no people",
      "Close-up of two glasses of chai on a wet steel counter, rain falling out of focus behind, bokeh from truck headlights",
    ],
    added: "2026-09-18",
  },
  {
    slug: "portrait-behind-rain-glass",
    category: "image",
    title: "Portrait behind rain-streaked glass",
    summary:
      "An emotional close-up portrait seen through a window covered in raindrops, lit by passing city lights.",
    prompt:
      "Intimate close-up portrait of a young man looking out of a bus window at night, raindrops and streaks across the glass in sharp focus, his face softly out of focus behind them, city lights blurred into red and amber bokeh, reflection of the street faintly visible on the glass, melancholic expression, natural skin texture, 85mm lens, f/1.8, cinematic color grading, teal shadows and warm highlights",
    negative:
      "smiling, studio lighting, plastic skin, over-sharpened, text, watermark, extra fingers",
    models: ["Midjourney", "Flux", "Stable Diffusion"],
    settings: {
      "Aspect ratio": "4:5",
      Style: "Photographic portrait",
      "Best for": "Instagram posts, song covers, story art",
    },
    tags: ["portrait", "rain", "emotional", "cinematic", "night"],
    tips: [
      "Putting focus on the raindrops, not the face, is what sells the mood. Keep 'face softly out of focus' in the prompt.",
      "Change 'young man' to any subject you need — the lighting recipe carries over unchanged.",
      "For a vertical story format use 9:16 and add 'subject in the lower third'.",
    ],
    variations: [
      "Same shot from inside a car, windshield wipers mid-swipe, traffic lights turning the rain red",
      "Black and white version, heavy grain, only the raindrops lit",
    ],
    added: "2026-09-18",
  },
  {
    slug: "punjabi-truck-art-poster",
    category: "image",
    title: "Punjabi truck-art style poster",
    summary:
      "A bold, hand-painted poster in the style of North Indian truck art — ornate borders, marigold colours and folk motifs.",
    prompt:
      "Vertical poster in the hand-painted style of North Indian and Pakistani truck art, ornate floral borders, peacocks and marigolds, bright saturated reds, yellows, teal and white, glossy enamel paint texture, small mirror-work details, a large decorative empty banner in the centre for a title, symmetrical composition, visible brush strokes, slightly weathered metal surface",
    negative:
      "photorealistic, 3d render, gradient background, minimalism, garbled text",
    models: ["Midjourney", "Ideogram", "GPT Image", "Flux"],
    settings: {
      "Aspect ratio": "2:3",
      Style: "Folk illustration, hand-painted",
      "Best for": "Event posters, merch, restaurant menus",
    },
    tags: ["poster", "folk art", "india", "colorful", "typography"],
    tips: [
      "Ask for an empty banner and add your own title in a design tool — every model still mangles long text in ornate lettering.",
      "Ideogram and GPT Image handle short text best. If you must generate the title, keep it to two or three words in quotes.",
      "Add 'on the tailgate of a truck' to get it painted on a real surface instead of a flat poster.",
    ],
    variations: [
      "Same style applied to a steel chai kettle, product photo on a wooden table",
      "Truck-art style border framing a modern smartphone mockup",
    ],
    added: "2026-09-17",
  },
  {
    slug: "golden-hour-mustard-fields",
    category: "image",
    title: "Golden hour over mustard fields",
    summary:
      "A wide landscape of blooming yellow mustard fields in Punjab at sunset, with a lone figure on a bicycle.",
    prompt:
      "Wide landscape photograph of endless blooming yellow mustard fields in rural Punjab at golden hour, a narrow dirt path running through the middle, a lone figure riding an old bicycle in the distance, a single tree on the horizon, low sun creating long shadows and backlit flowers, light haze, warm soft light, shot on a full-frame camera with a 24mm lens, high dynamic range, natural colours",
    negative: "oversaturated, HDR halo, text, watermark, crowds, buildings",
    models: ["Midjourney", "Flux", "Stable Diffusion", "GPT Image"],
    settings: {
      "Aspect ratio": "21:9",
      Style: "Landscape photography",
      "Best for": "Desktop wallpapers, website heroes",
    },
    tags: ["landscape", "golden hour", "india", "nature", "wallpaper"],
    tips: [
      "'Backlit flowers' is the phrase that makes the field glow instead of looking flat yellow.",
      "Ultra-wide ratios like 21:9 give the most cinematic result; 16:9 still works if your model does not support it.",
      "Remove the cyclist for a clean background you can put text over.",
    ],
    added: "2026-09-16",
  },
  {
    slug: "minimal-perfume-product-shot",
    category: "image",
    title: "Minimal luxury product shot",
    summary:
      "A clean, premium e-commerce photo of a glass perfume bottle on stone with soft shadows — swap in any product.",
    prompt:
      "Minimal luxury product photograph of a frosted glass perfume bottle standing on a rough travertine stone block, soft window light from the left, long gentle shadow, beige and warm sand colour palette, a single dried pampas stem out of focus in the background, clean composition with generous negative space, commercial studio photography, 100mm macro lens, crisp detail on the glass, subtle reflections",
    negative:
      "text on bottle, brand logo, clutter, harsh flash, dramatic colours, watermark",
    models: ["Midjourney", "Flux", "GPT Image", "Stable Diffusion"],
    settings: {
      "Aspect ratio": "1:1 or 4:5",
      Style: "Commercial product photography",
      "Best for": "Shopify listings, Instagram ads, landing pages",
    },
    tags: ["product", "minimal", "ecommerce", "studio", "marketing"],
    tips: [
      "Replace 'frosted glass perfume bottle' with your product and keep everything else — the lighting and surface are the reusable part.",
      "If you have a real product photo, use image-to-image or a reference image so the shape stays accurate.",
      "Ask for 'no text on bottle' and add your label afterwards; generated labels are never on-brand.",
    ],
    variations: [
      "Same setup with a skincare jar, water droplets on the stone, cool morning light",
      "Dark version: black marble, single hard spotlight from above, dramatic shadow",
    ],
    added: "2026-09-15",
  },
  {
    slug: "retro-hand-painted-film-poster",
    category: "image",
    title: "Retro hand-painted film poster",
    summary:
      "A 1970s-style hand-painted Indian cinema poster with dramatic faces, bold colours and space for your own title.",
    prompt:
      "1970s Indian cinema hand-painted film poster, dramatic close-up faces of an original hero and heroine in the upper half, a rain-soaked city street and a speeding vintage car in the lower half, bold brush strokes, saturated reds, oranges and deep blues, slightly faded paper with folds and worn edges, large blank area at the bottom for the title, painterly illustration, retro print texture",
    negative:
      "photorealistic, modern clothing, readable text, celebrity likeness, watermark",
    models: ["Midjourney", "Flux", "GPT Image"],
    settings: {
      "Aspect ratio": "2:3",
      Style: "Vintage painted illustration",
      "Best for": "Party invites, YouTube thumbnails, playlist covers",
    },
    tags: ["poster", "retro", "bollywood", "illustration", "vintage"],
    tips: [
      "Keep 'original hero and heroine' — prompting for a real actor's likeness is against most tools' rules and makes the image unusable commercially.",
      "Upload your own photo as a reference to get yourself painted into the poster.",
      "'Folds and worn edges' is what makes it feel found rather than generated.",
    ],
    added: "2026-09-14",
  },
  {
    slug: "isometric-chai-stall-diorama",
    category: "image",
    title: "Isometric chai stall diorama",
    summary:
      "A cute 3D isometric miniature of a street tea stall — great for app illustrations and presentations.",
    prompt:
      "Isometric 3D miniature diorama of a small Indian street chai stall on a square base, tiny steel kettle on a gas stove, stacked glass cups, biscuit jars, a small wooden bench, hanging bulb, a sleeping street dog, soft clay-like materials, pastel colours with warm accents, soft global illumination, tilt-shift look, clean light grey background, highly detailed, cute and cozy",
    negative: "realistic photo, people with distorted faces, dark background, text",
    models: ["Midjourney", "GPT Image", "Flux", "Stable Diffusion"],
    settings: {
      "Aspect ratio": "1:1",
      Style: "3D render, isometric",
      "Best for": "App onboarding, slides, blog illustrations",
    },
    tags: ["3d", "isometric", "cute", "illustration", "india"],
    tips: [
      "'On a square base' keeps the diorama self-contained so it drops cleanly onto any background.",
      "Swap the chai stall for any small scene — a bookshop, a barber, a bus stop — and keep the rest.",
      "For a transparent PNG, generate on the light grey background and remove it with a background-removal tool.",
    ],
    variations: [
      "Same diorama at night, rain falling, bulb glowing, puddles on the base",
      "Isometric miniature of a cassette and radio repair shop, same style",
    ],
    added: "2026-09-13",
  },
  {
    slug: "futuristic-old-city-alley",
    category: "image",
    title: "Futuristic old-city alley",
    summary:
      "A cyberpunk take on a crowded old-city bazaar — holograms, tangled wires and neon over centuries-old buildings.",
    prompt:
      "Futuristic narrow alley in an old North Indian city in the year 2080, centuries-old havelis with carved balconies covered in neon Hindi and Punjabi signs, holographic advertisements, tangled overhead cables, a cycle rickshaw with glowing wheels, street vendors under umbrellas, light rain, wet reflective ground, dense atmosphere, cinematic cyberpunk lighting in magenta and amber, wide-angle, ultra detailed",
    negative: "empty street, daylight, blurry, low detail, watermark",
    models: ["Midjourney", "Flux", "Stable Diffusion"],
    settings: {
      "Aspect ratio": "16:9",
      Style: "Cinematic concept art",
      "Best for": "Wallpapers, game concept art, thumbnails",
    },
    tags: ["cyberpunk", "sci-fi", "india", "neon", "concept art"],
    tips: [
      "Grounding the future in a real place ('carved balconies', 'cycle rickshaw') is what stops it looking like every other cyberpunk image.",
      "Neon signs will come out as pseudo-script. That is fine here — it reads as texture, not text.",
      "Drop 'light rain' for a dusty daytime version with harsh sun and haze.",
    ],
    added: "2026-09-12",
  },
  {
    slug: "professional-linkedin-headshot",
    category: "image",
    title: "Professional headshot from a selfie",
    summary:
      "Turn a casual selfie into a clean, professional profile photo with studio lighting and a neutral background.",
    prompt:
      "Professional corporate headshot of the person in the reference photo, keep their exact facial features and hairstyle, wearing a navy blazer over a white shirt, soft studio lighting with a large key light from the front-left and gentle fill, neutral light grey seamless background, shoulders slightly angled, confident friendly expression, sharp focus on the eyes, natural skin texture, 85mm portrait lens",
    negative:
      "different person, plastic skin, heavy retouching, busy background, harsh shadows",
    models: ["GPT Image", "Midjourney (with image reference)", "Flux Kontext"],
    settings: {
      "Aspect ratio": "1:1",
      Input: "One clear, front-facing reference photo",
      "Best for": "LinkedIn, resumes, team pages",
    },
    tags: ["portrait", "headshot", "professional", "photo editing"],
    tips: [
      "This only works with an image-reference or editing model — paste the prompt alongside your photo.",
      "'Keep their exact facial features' matters; without it many models drift toward a generic face.",
      "Use a reference photo with even lighting. Harsh shadows in the input tend to survive into the output.",
    ],
    variations: [
      "Same, but outdoors in soft evening light with a blurred green background",
      "Creative version: dark charcoal background, dramatic side light, black turtleneck",
    ],
    added: "2026-09-11",
  },
  {
    slug: "watercolor-old-city-dawn",
    category: "image",
    title: "Watercolor sketch of an old street at dawn",
    summary:
      "A loose ink-and-watercolor travel sketch of a quiet old-city street, like a page from an artist's journal.",
    prompt:
      "Loose urban sketch in ink and watercolor of a quiet old-city street at dawn, narrow lane with old brick houses, wooden doors and balconies, a milkman on a bicycle, pigeons on the wires, soft washes of peach, ochre and pale blue, confident uneven ink lines, lots of white paper showing through, drips and blooms of paint, textured cold-press paper, travel journal style",
    negative: "photorealistic, digital painting, heavy outlines, full colour fill, text",
    models: ["Midjourney", "Flux", "Stable Diffusion", "GPT Image"],
    settings: {
      "Aspect ratio": "3:2",
      Style: "Ink and watercolor",
      "Best for": "Prints, greeting cards, travel blogs",
    },
    tags: ["watercolor", "illustration", "travel", "sketch", "art"],
    tips: [
      "'Lots of white paper showing through' is the key phrase — without it you get a full painting instead of a sketch.",
      "Name your own city or landmark to make it personal.",
      "Add 'on the open pages of a sketchbook, top-down photo' for a mockup-style image.",
    ],
    added: "2026-09-10",
  },
  {
    slug: "nostalgic-cassette-letter-flatlay",
    category: "image",
    title: "Nostalgic cassettes and old letters flat lay",
    summary:
      "A top-down, film-look flat lay of mixtapes, handwritten letters and dried flowers — made for breakup-song playlists.",
    prompt:
      "Top-down flat lay photo of old audio cassette tapes with blank handwritten labels, a folded handwritten letter with smudged ink, a dried red rose, a torn photo strip turned face down, a pair of wired earphones, all on a worn wooden desk, soft window light from the side, warm faded film colours, slight grain, nostalgic and melancholic mood, 50mm lens",
    negative:
      "readable text, brand names, harsh flash, clutter, modern phone, watermark",
    models: ["Midjourney", "Flux", "GPT Image", "Stable Diffusion"],
    settings: {
      "Aspect ratio": "1:1",
      Style: "Film photography, flat lay",
      "Best for": "Playlist covers, Instagram, story backgrounds",
    },
    tags: ["flat lay", "nostalgic", "retro", "emotional", "music"],
    tips: [
      "Square is the right ratio for playlist and album covers on every streaming service.",
      "'Photo strip turned face down' tells a story without needing a face — and avoids distorted faces entirely.",
      "Leave the top third emptier ('empty space at the top') if you want to add a title.",
    ],
    added: "2026-09-09",
  },
  {
    slug: "minimal-chai-brand-logo",
    category: "image",
    title: "Minimal logo mark for a small brand",
    summary:
      "A flat, geometric logo mark concept for a tea brand — a quick way to explore directions before hiring a designer.",
    prompt:
      "Minimal flat vector logo mark for a small artisanal chai brand, a single continuous line forming a tea glass with rising steam that also reads as a heart, geometric, balanced negative space, two colours only: deep brick red on warm cream background, centered, no text, clean sharp edges, suitable for a small app icon",
    negative:
      "3d, gradients, shadows, photorealistic, multiple logos, text, mockup, clutter",
    models: ["Ideogram", "GPT Image", "Midjourney", "Recraft"],
    settings: {
      "Aspect ratio": "1:1",
      Style: "Flat vector",
      "Best for": "Brand exploration, moodboards",
    },
    tags: ["logo", "branding", "minimal", "vector", "design"],
    tips: [
      "Treat the output as a sketch. Redraw the chosen direction as a real vector before using it as a logo.",
      "Limiting it to two named colours stops the model adding gradients and glow.",
      "Ask for 'a grid of 6 logo variations' to explore several directions in one generation.",
    ],
    added: "2026-09-08",
  },
];
