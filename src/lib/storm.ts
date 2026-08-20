/**
 * The storm over Jalandhar.
 *
 * It rains everywhere on this site, always — so it should also be lightning,
 * always. This module is the clock behind that: it schedules strikes for as
 * long as anyone is watching, hands each one to the backdrop to draw, and asks
 * lib/ambience.ts for the thunder a beat later.
 *
 * Light first, sound after. That gap is the only thing that makes lightning
 * feel like distance rather than decoration, and it is why one module owns
 * both halves — a flash and a clap scheduled independently would drift.
 *
 * Two things scale the weather:
 *
 *   - by default a far storm: mostly sheet lightning on the horizon, a bolt
 *     roughly every third strike, something to see every 15-30 seconds.
 *   - the Baarish fader in Tapri Mode raises `level`, which drags the storm
 *     overhead — closer, brighter, more often, louder.
 *
 * Sound is the part that cannot be promised. Browsers refuse to play anything
 * until the visitor has interacted with the page, so thunder stays silent
 * until the first click or keypress and the flashes carry the effect alone.
 * Nothing here waits on that: the sky does not care whether audio is up.
 */

import { ambience } from "./ambience";

/**
 * One strike. `distance` is the whole model — 0 is directly overhead, 1 is a
 * grumble on the horizon — and everything else falls out of it. A near strike
 * is bright, draws a bolt, cracks almost immediately and pans hard; a far one
 * is a dull sheet of light with a rumble that takes seconds to arrive.
 */
export type Strike = {
  /** monotonic, so the renderer can key a flash without a random id */
  id: number;
  /** 0 = overhead, 1 = the far horizon */
  distance: number;
  /** how hard the sky lights up, 0..1 */
  brightness: number;
  /** ms between the flash and its thunder — sound is the slow one */
  delay: number;
  /** close enough to draw the bolt itself rather than sheet glow */
  bolt: boolean;
  /** where it hit, -1 hard left .. 1 hard right */
  pan: number;
  /** how loud this clap is allowed to get, 0..1 */
  power: number;
};

class Storm {
  private timer: number | null = null;
  private watchers = new Set<(s: Strike) => void>();
  private struck = 0;
  /** extra weather from the Baarish fader, 0..1 */
  private level = 0;
  private listening = false;

  /**
   * Watch the sky. Returns its own unsubscribe, so it drops straight into a
   * `useEffect`.
   *
   * The storm runs only while something is watching. That is not just tidiness:
   * calm mode unmounts the renderer, and a visitor who has asked for the
   * weather to stop should not be getting thunder either.
   */
  watch(cb: (s: Strike) => void) {
    this.watchers.add(cb);
    this.unlockOnGesture();
    // first flash comes quickly — a storm you have to wait half a minute for
    // is a storm nobody knows is there
    if (this.timer === null) this.queue(2000 + Math.random() * 4000);

    return () => {
      this.watchers.delete(cb);
      if (this.watchers.size === 0 && this.timer !== null) {
        window.clearTimeout(this.timer);
        this.timer = null;
      }
    };
  }

  /** how heavy the weather is, 0..1 — the Baarish fader owns this */
  setLevel(level: number) {
    this.level = level;
  }

  /**
   * Open the audio path at the first opportunity the browser allows, so that
   * thunder has somewhere to play. Deliberately not `once: true` on each
   * listener separately — either event should retire both.
   */
  private unlockOnGesture() {
    if (this.listening || typeof window === "undefined") return;
    this.listening = true;

    const unlock = () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      ambience.unlock();
    };
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
  }

  private queue(wait: number) {
    this.timer = window.setTimeout(() => {
      this.timer = null;
      this.fire();
      if (this.watchers.size === 0) return;
      // 14-32s apart by default, 7-17s once the rain is all the way up
      const v = this.level;
      this.queue(7000 + (1 - v) * 7000 + Math.random() * (10000 + (1 - v) * 8000));
    }, wait);
  }

  /** roll the dice, light the sky, book the thunder */
  private fire() {
    const v = this.level;
    // A coin weighted by the fader. Even at rest `near` reaches 0.75, so about
    // a third of strikes are close enough to draw a channel; turn the rain up
    // and half of them are.
    const near = Math.random() * (0.75 + v * 0.25);

    const strike: Strike = {
      id: ++this.struck,
      distance: 1 - near,
      brightness: 0.3 + near * 0.7,
      // ~3s per km, the school-playground rule, over a storm a couple of km out
      delay: 140 + (1 - near) * 3400,
      bolt: near > 0.5,
      pan: (Math.random() * 2 - 1) * 0.75,
      // a distant storm should not be silent, only quiet
      power: 0.4 + v * 0.6,
    };

    for (const cb of this.watchers) cb(strike);
    ambience.thunder(strike);
  }
}

/** One storm for the page — see the note on `ambience` for why this is shared. */
export const storm = new Storm();
