"use client";
import confetti from "canvas-confetti";
import { useStore } from "./store";

const BRAND = ["#E63462", "#F2542D", "#FFD23F", "#0E8C99", "#9BE15D"];

function reduced() {
  const m = useStore.getState().motion;
  return m === "reduced" || (m === "system" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

export function celebrate(strength: "small" | "big" = "big") {
  if (typeof window === "undefined" || reduced()) return;
  if (strength === "small") {
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: BRAND, scalar: 0.9 });
    return;
  }
  const end = Date.now() + 900;
  const frame = () => {
    confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: BRAND });
    confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: BRAND });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  confetti({ particleCount: 120, spread: 100, startVelocity: 45, origin: { y: 0.55 }, colors: BRAND, shapes: ["circle", "square"] });
  frame();
}

// ---- Tiny WebAudio synth: no audio files needed ----
let ctx: AudioContext | null = null;
function audio() {
  if (!useStore.getState().sound || typeof window === "undefined") return null;
  ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function blip(freq: number, dur: number, type: OscillatorType = "triangle", gain = 0.08, when = 0) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + when;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  tick: () => blip(1400, 0.035, "square", 0.035),
  pop: () => blip(660, 0.09, "sine", 0.1),
  win: () => [523, 659, 784, 1046].forEach((f, i) => blip(f, 0.22, "triangle", 0.09, i * 0.09)),
  whoosh: () => blip(220, 0.25, "sawtooth", 0.03),
};
