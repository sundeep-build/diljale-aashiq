/**
 * Tapri Mode — the ambience you layer under the music.
 *
 * Every sound here is SYNTHESISED in the browser with the Web Audio API:
 * filtered noise plus a low-frequency oscillator per layer. There are no mp3s
 * to host, nothing to download, and no bandwidth bill — which is the whole
 * point on a free-tier deploy.
 *
 * It also synthesises THUNDER, which is not a layer at all — it is one-shot,
 * and it is fired by lib/storm.ts rather than by anything on this page. The
 * split is deliberate: the storm runs for every visitor from the moment the
 * page loads, but only this module is allowed to own an AudioContext, so the
 * storm asks and this module plays if audio has been unlocked.
 */

export type LayerId = "baarish" | "tapri" | "rail" | "pankha";

import type { Strike } from "./storm";

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

  /** kept on the instance because thunder borrows them for every clap */
  private noise: Record<"white" | "brown", AudioBuffer> | null = null;

  /**
   * The context and nothing else: a master gain and the two noise buffers
   * thunder is cut from. No sources, so this is close to free — which is the
   * point, because the storm opens it for every visitor and most of them will
   * never touch a fader.
   *
   * Must still be reached from a user gesture the first time; browsers block
   * audio otherwise. See `unlock()`.
   */
  private context() {
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

    this.noise = {
      white: makeNoiseBuffer(ctx, "white"),
      brown: makeNoiseBuffer(ctx, "brown"),
    };

    return ctx;
  }

  /**
   * Open the audio path without making a sound, so a thunderclap two minutes
   * from now has somewhere to play. Called from the first pointer or key
   * event on the page — the earliest moment the autoplay rules allow.
   */
  unlock() {
    this.context();
  }

  /** The context plus the four steady layers, built the first time a fader moves. */
  private ensure() {
    const ctx = this.context();
    if (!ctx || this.layers.size > 0) return ctx;

    const master = this.master;
    const noise = this.noise;
    if (!master || !noise) return ctx;
    const { white, brown } = noise;

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
    this.noise = null;
    this.layers.clear();
    // the graph is gone, so the record of what was playing has to go with it —
    // otherwise a rebuilt context would believe layers are up that are silent
    for (const id of Object.keys(this.volumes) as LayerId[]) this.volumes[id] = 0;
  }

  /**
   * The clap. Three voices, mixed by distance:
   *
   *   crack  — a short slap of high noise, the tearing sound of a near hit.
   *            Gone entirely once the strike is more than a moment away.
   *   body   — noise under a lowpass that falls as the sound travels, which
   *            is the whole trick: air eats the treble first, so a distant
   *            storm is the same clap with everything above a rumble removed.
   *   sub    — a sine dropping toward 30Hz. The part you feel rather than hear.
   *
   * The amplitude curve matters as much as the filter. Thunder does not fade
   * out smoothly — it tumbles, because you are hearing one flash reflected off
   * clouds and buildings at a dozen different distances. The sine riding on
   * the decay below is what turns a whoosh into a roll.
   */
  thunder(strike: Strike) {
    const ctx = this.ctx;
    const master = this.master;
    const noise = this.noise;
    // No context means nobody has touched the page yet, so there is nothing to
    // play through and no way to open one. The sky flashes silently.
    if (!ctx || !master || !noise) return;
    // parked by the idle-suspend in `set()`; a clap is reason enough to wake it
    if (ctx.state === "suspended") void ctx.resume();

    const near = 1 - strike.distance;
    const at = ctx.currentTime + strike.delay / 1000;
    const dur = 2.4 + strike.distance * 4.4; // the far ones roll for longer
    const level = strike.power * (0.22 + near * 0.5);

    const pan = ctx.createStereoPanner?.();
    const out: AudioNode = pan ?? master;
    if (pan) {
      pan.pan.value = strike.pan;
      pan.connect(master);
    }

    /* ---- body ---- */
    const body = ctx.createBufferSource();
    body.buffer = noise.brown;
    body.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(240 + near * 1500, at);
    lp.frequency.exponentialRampToValueAtTime(64 + near * 70, at + dur);
    lp.Q.value = 0.7;

    const bodyGain = ctx.createGain();
    bodyGain.gain.value = 0;
    bodyGain.gain.setValueCurveAtTime(rollCurve(strike, level * 2.6), at, dur);

    body.connect(lp).connect(bodyGain).connect(out);
    // a random offset into the loop so no two claps are the same four seconds
    body.start(at, Math.random() * 3);
    body.stop(at + dur);

    /* ---- sub ---- */
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(58 + near * 30, at);
    sub.frequency.exponentialRampToValueAtTime(29, at + dur * 0.7);

    const subGain = ctx.createGain();
    subGain.gain.value = 0;
    subGain.gain.setValueAtTime(0, at);
    subGain.gain.linearRampToValueAtTime(level * 0.5 * (0.3 + near), at + 0.05 + strike.distance * 0.2);
    subGain.gain.exponentialRampToValueAtTime(0.0001, at + dur * 0.75);

    sub.connect(subGain).connect(out);
    sub.start(at);
    sub.stop(at + dur * 0.8);

    /* ---- crack ---- */
    if (strike.bolt) {
      const crack = ctx.createBufferSource();
      crack.buffer = noise.white;
      crack.loop = true;

      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 700 + near * 900;

      const crackGain = ctx.createGain();
      crackGain.gain.value = 0;
      crackGain.gain.setValueAtTime(0, at);
      crackGain.gain.linearRampToValueAtTime(level * 0.85 * near, at + 0.012);
      crackGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.35 + near * 0.4);

      crack.connect(hp).connect(crackGain).connect(out);
      crack.start(at, Math.random() * 3);
      crack.stop(at + 0.8);
    }

    // one clap is a dozen nodes; cut the branch loose once it has finished so
    // the graph does not grow by that much every time the sky flashes
    body.onended = () => {
      window.setTimeout(() => (pan ?? bodyGain).disconnect(), 0);
    };
  }
}

/**
 * One engine for the whole page.
 *
 * Tapri Mode drives the faders and lib/storm.ts fires the thunder, and they
 * sit in completely different parts of the tree — a shared module-level
 * instance is how they end up on the same AudioContext, which matters because
 * browsers cap how many of those you may open. Constructing it is free:
 * nothing reaches the audio hardware until `unlock()` or the first fader move.
 */
export const ambience = new Ambience();

/**
 * The rolling amplitude envelope, as a curve rather than a stack of ramps:
 * attack (slow for a distant strike, a slap for a near one), then a decay
 * with two lazy swells riding on it so the tail tumbles down instead of
 * sliding out.
 */
function rollCurve(strike: Strike, peak: number) {
  const steps = 72;
  const curve = new Float32Array(steps);
  const attack = Math.max(1, Math.round(steps * (0.015 + strike.distance * 0.13)));

  for (let i = 0; i < steps; i++) {
    if (i < attack) {
      curve[i] = (i / attack) * peak;
      continue;
    }
    const t = (i - attack) / (steps - attack); // 0..1 across the tail
    const decay = Math.pow(1 - t, 1.7);
    const roll = 0.68 + 0.32 * Math.sin(t * Math.PI * 3.4 + strike.pan * 2);
    curve[i] = decay * roll * peak;
  }

  curve[steps - 1] = 0;
  return curve;
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
