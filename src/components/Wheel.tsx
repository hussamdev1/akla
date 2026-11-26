"use client";
import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent } from "motion/react";
import { sfx } from "@/lib/fx";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { CATEGORIES } from "@/data/categories";
import { Lugma } from "./Logo";

export type WheelItem = { id: string; label: string; emoji: string };
export type WheelHandle = { spin: () => void };

const PALETTE = ["#E63462", "#FFD23F", "#F2542D", "#9BE15D", "#0E8C99", "#7DD3FC", "#FF8FAB", "#E9B5FF"];
const TEXT_ON = (c: string) => (["#FFD23F", "#9BE15D", "#7DD3FC", "#FF8FAB", "#E9B5FF"].includes(c) ? "#2B1B3D" : "#FFFFFF");

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  // round so server and browser produce identical SVG (avoids hydration mismatches)
  const r2 = (v: number) => Math.round(v * 100) / 100;
  return [r2(cx + r * Math.cos(a)), r2(cy + r * Math.sin(a))];
}

function slicePath(i: number, n: number, r: number) {
  const seg = 360 / n;
  const [x1, y1] = polar(0, 0, r, i * seg);
  const [x2, y2] = polar(0, 0, r, (i + 1) * seg);
  const large = seg > 180 ? 1 : 0;
  return `M0 0 L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

const short = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

export function Wheel({ items, onResult, onStart, disabled, ref }: { items: WheelItem[]; onResult: (index: number) => void; onStart?: () => void; disabled?: boolean; ref?: Ref<WheelHandle> }) {
  const rotate = useMotionValue(0);
  const pointer = useMotionValue(0);
  const [spinning, setSpinning] = useState(false);
  const lastSeg = useRef(-1);
  const reduced = usePrefersReducedMotion();
  const n = Math.max(items.length, 1);
  const seg = 360 / n;
  const R = 200;

  useMotionValueEvent(rotate, "change", (v) => {
    if (!spinning) return;
    const idx = Math.floor((((-v % 360) + 360) % 360) / seg);
    if (idx !== lastSeg.current) {
      lastSeg.current = idx;
      sfx.tick();
      pointer.set(-22);
      animate(pointer, 0, { type: "spring", stiffness: 600, damping: 12 });
    }
  });

  const spin = async () => {
    if (spinning || disabled || !items.length) return;
    setSpinning(true);
    onStart?.();
    sfx.whoosh();
    const winner = Math.floor(Math.random() * items.length);
    const cur = rotate.get();
    const jitter = (Math.random() - 0.5) * seg * 0.6;
    const want = -((winner + 0.5) * seg + jitter);
    const base = cur - (((cur % 360) + 360) % 360);
    const target = base + 360 * (reduced ? 1 : 7) + (((want % 360) + 360) % 360);
    if (!reduced) await animate(rotate, cur - 14, { duration: 0.28, ease: "easeOut" });
    await animate(rotate, target, { duration: reduced ? 0.8 : 5.4, ease: [0.12, 0.72, 0.12, 1] });
    setSpinning(false);
    sfx.win();
    onResult(winner);
  };

  useImperativeHandle(ref, () => ({ spin }));

  const fontSize = n > 12 ? 13 : n > 8 ? 15 : 18;
  const maxChars = n > 12 ? 11 : n > 8 ? 13 : 16;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(88vw,30rem)] select-none" style={{ direction: "ltr" }}>
      {/* glow */}
      <div className="absolute inset-[6%] rounded-full bg-brand/40 blur-2xl" />
      {/* pointer */}
      <motion.div className="absolute start-1/2 top-[-4%] z-20 -translate-x-1/2" style={{ rotate: pointer, transformOrigin: "50% 20%" }}>
        <svg width="54" height="64" viewBox="0 0 54 64" aria-hidden>
          <path d="M27 62 L6 18 A22 22 0 1 1 48 18 Z" fill="#F2542D" stroke="#2B1B3D" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="27" cy="22" r="8" fill="white" stroke="#2B1B3D" strokeWidth="3" />
        </svg>
      </motion.div>
      <svg viewBox="-220 -220 440 440" className="relative size-full drop-shadow-[6px_6px_0_#2B1B3D]" role="img" aria-label="Food wheel">
        <circle r="216" fill="#2B1B3D" />
        <circle r="208" fill="#FFF8EE" />
        {/* rim lights */}
        {Array.from({ length: 24 }).map((_, i) => {
          const [x, y] = polar(0, 0, 212, i * 15);
          return (
            <circle key={i} cx={x} cy={y} r="4" fill={i % 2 ? "#FFD23F" : "#FFFFFF"} stroke="#2B1B3D" strokeWidth="1.5">
              {spinning && <animate attributeName="opacity" values="1;0.2;1" dur="0.5s" begin={`${(i % 2) * 0.25}s`} repeatCount="indefinite" />}
            </circle>
          );
        })}
        <motion.g style={{ rotate }}>
          {items.map((it, i) => {
            // avoid the first and last slice sharing a colour
            const color = PALETTE[i === n - 1 && n > 1 && n % PALETTE.length === 1 ? 2 : i % PALETTE.length];
            const mid = (i + 0.5) * seg;
            const [ex, ey] = polar(0, 0, R * 0.8, mid);
            return (
              <g key={it.id + i}>
                <path d={slicePath(i, n, R)} fill={color} stroke="#2B1B3D" strokeWidth="2.5" />
                {/* flip labels on the left half so they never read upside-down */}
                <g transform={`rotate(${mid > 180 ? mid + 90 : mid - 90})`}>
                  <text x={mid > 180 ? -R * 0.56 : R * 0.56} y={fontSize / 3} textAnchor="middle" fontSize={fontSize} fontWeight={800} fill={TEXT_ON(color)} style={{ fontFamily: "var(--font-display)" }}>
                    {short(it.label, maxChars)}
                  </text>
                </g>
                <text x={ex} y={ey} textAnchor="middle" dominantBaseline="central" fontSize={n > 12 ? 18 : 24}>
                  {it.emoji}
                </text>
              </g>
            );
          })}
        </motion.g>
        <circle r="46" fill="#FFFFFF" stroke="#2B1B3D" strokeWidth="4" />
      </svg>
      <button
        type="button"
        onClick={spin}
        disabled={spinning || disabled}
        className="absolute left-1/2 top-1/2 z-10 grid size-[22%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-transform hover:scale-105 active:scale-95 disabled:cursor-wait"
        aria-label="Spin"
      >
        <motion.span animate={spinning ? { rotate: [0, -10, 10, 0] } : {}} transition={{ repeat: Infinity, duration: 0.4 }}>
          <Lugma size={72} mood={spinning ? "wow" : "happy"} />
        </motion.span>
      </button>
    </div>
  );
}

/** Small decorative wheel for the hero. */
export function MiniWheel({ size = 120 }: { size?: number }) {
  const items = CATEGORIES.slice(0, 8);
  const n = items.length;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="-110 -110 220 220" className="size-full animate-[spin_14s_linear_infinite] drop-shadow-[3px_3px_0_#2B1B3D]">
        <circle r="106" fill="#2B1B3D" />
        {items.map((c, i) => {
          const [ex, ey] = polar(0, 0, 66, (i + 0.5) * (360 / n));
          return (
            <g key={c.id}>
              <path d={slicePath(i, n, 100)} fill={PALETTE[i % PALETTE.length]} stroke="#2B1B3D" strokeWidth="3" />
              <text x={ex} y={ey} textAnchor="middle" dominantBaseline="central" fontSize="26">
                {c.emoji}
              </text>
            </g>
          );
        })}
        <circle r="24" fill="white" stroke="#2B1B3D" strokeWidth="3" />
      </svg>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Lugma size={size * 0.3} />
      </div>
    </div>
  );
}
