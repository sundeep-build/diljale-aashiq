/**
 * Tapri Mode — the ambience you layer under the music.
 *
 * Every sound here is SYNTHESISED in the browser with the Web Audio API:
 * filtered noise plus a low-frequency oscillator per layer. There are no mp3s
 * to host, nothing to download, and no bandwidth bill — which is the whole
 * point on a free-tier deploy.
 */

export type LayerId = "baarish" | "tapri" | "rail" | "pankha";

type LayerSpec = {
  id: LayerId;
  /** brown noise is a deeper rumble; white is hiss */
  noise: "white" | "brown";
  filter: { type: BiquadFilterType; freq: number; q?: number };
  /** optional second filter stage */
  filter2?: { type: BiquadFilterType; freq: number; q?: number };
  /** amplitude wobble: rate in Hz, depth as a fraction of volume */
  lfo: { rate: number; depth: number };
  /** per-layer trim so nothing drowns the music */
  trim: number;
};

const SPECS: LayerSpec[] = [
  {
    id: "baarish",
    noise: "white",
    filter: { type: "highpass", freq: 620 },
    filter2: { type: "lowpass", freq: 7200 },
    lfo: { rate: 0.13, depth: 0.22 },
    trim: 0.5,
  },
  {
    id: "tapri",
    noise: "brown",
    filter: { type: "lowpass", freq: 760 },
    filter2: { type: "peaking", freq: 300, q: 1.2 },
    lfo: { rate: 0.21, depth: 0.35 },
    trim: 0.85,
  },
  {
    id: "rail",
    noise: "brown",
    filter: { type: "lowpass", freq: 260 },
    lfo: { rate: 2.35, depth: 0.6 },
    trim: 0.9,
  },
  {
    id: "pankha",
    noise: "white",
    filter: { type: "bandpass", freq: 430, q: 2.4 },
    lfo: { rate: 5.1, depth: 0.55 },
    trim: 0.7,
  },
];

type Layer = {
  gain: GainNode;
  lfoGain: GainNode;
  spec: LayerSpec;
  volume: number;
};

export class Ambience {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private layers = new Map<LayerId, Layer>();
  private volumes: Record<LayerId, number> = {
    baarish: 0,
    tapri: 0,
    rail: 0,
    pankha: 0,
  };

  /** Must be called from a user gesture — browsers block audio otherwise. */
  private ensure() {
    if (this.ctx) return this.ctx;

    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;

    const ctx = new Ctor();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
    this.master = master;

    const white = makeNoiseBuffer(ctx, "white");
    const brown = makeNoiseBuffer(ctx, "brown");

    for (const spec of SPECS) {
      const src = ctx.createBufferSource();
      src.buffer = spec.noise === "white" ? white : brown;
      src.loop = true;

      const f1 = ctx.createBiquadFilter();
      f1.type = spec.filter.type;
      f1.frequency.value = spec.filter.freq;
      if (spec.filter.q) f1.Q.value = spec.filter.q;

      let tail: AudioNode = f1;
      if (spec.filter2) {
        const f2 = ctx.createBiquadFilter();
        f2.type = spec.filter2.type;
        f2.frequency.value = spec.filter2.freq;
        if (spec.filter2.q) f2.Q.value = spec.filter2.q;
        f1.connect(f2);
        tail = f2;
      }

      const gain = ctx.createGain();
      gain.gain.value = 0;

      // LFO rides on top of the base gain so the layer breathes
      const lfo = ctx.createOscillator();
      lfo.frequency.value = spec.lfo.rate;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0;
      lfo.connect(lfoGain).connect(gain.gain);
      lfo.start();

      src.connect(f1);
      tail.connect(gain);
      gain.connect(master);
      src.start();

      this.layers.set(spec.id, { gain, lfoGain, spec, volume: 0 });
    }

    return ctx;
  }

  /** volume is 0..1 straight off the slider */
  set(id: LayerId, volume: number) {
    this.volumes[id] = volume;
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();

    const layer = this.layers.get(id);
    if (!layer) return;

    const target = volume * layer.spec.trim;
    const t = ctx.currentTime;
    layer.gain.gain.cancelScheduledValues(t);
    layer.gain.gain.setTargetAtTime(target, t, 0.12);
    layer.lfoGain.gain.setTargetAtTime(target * layer.spec.lfo.depth, t, 0.12);
    layer.volume = volume;

    // nothing playing → let the browser park the audio thread
    if (Object.values(this.volumes).every((v) => v === 0)) {
      window.setTimeout(() => {
        if (Object.values(this.volumes).every((v) => v === 0)) void this.ctx?.suspend();
      }, 500);
    }
  }

  mute() {
    for (const id of Object.keys(this.volumes) as LayerId[]) this.set(id, 0);
  }

  dispose() {
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.layers.clear();
  }
}

/** 4 seconds of loopable noise, generated once and shared by every layer. */
function makeNoiseBuffer(ctx: AudioContext, kind: "white" | "brown") {
  const seconds = 4;
  const length = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (kind === "white") {
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  } else {
    // integrated white noise, scaled back up — the classic brown-noise recipe
    let last = 0;
    for (let i = 0; i < length; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    }
  }

  // crossfade the seam so the 4s loop has no audible click
  const fade = Math.floor(ctx.sampleRate * 0.05);
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    data[i] = data[i] * k + data[length - fade + i] * (1 - k);
  }

  return buffer;
}
