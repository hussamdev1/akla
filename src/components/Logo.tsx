"use client";
import { useId } from "react";
import { useI18n } from "@/lib/i18n";

/** Lugma — the bitten bun. The bite (top-right) is the brand signature. Never mirrored. */
export function Lugma({ size = 40, mood = "happy", className = "" }: { size?: number; mood?: "happy" | "wow" | "hungry"; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden style={{ direction: "ltr" }}>
      <defs>
        <mask id={`bite-${id}`}>
          <rect width="64" height="64" fill="white" />
          <circle cx="55" cy="9" r="13" fill="black" />
        </mask>
        <clipPath id={`bun-${id}`}>
          <circle cx="32" cy="34" r="27.5" />
        </clipPath>
      </defs>
      <g mask={`url(#bite-${id})`}>
        <circle cx="32" cy="34" r="26" fill="#E63462" stroke="#2B1B3D" strokeWidth="3" />
        <ellipse cx="22" cy="22" rx="7" ry="4" fill="#FF8FAB" transform="rotate(-25 22 22)" />
      </g>
      <circle cx="55" cy="9" r="13" fill="none" stroke="#2B1B3D" strokeWidth="3" clipPath={`url(#bun-${id})`} />
      {/* crumbs */}
      <circle cx="58" cy="27" r="1.8" fill="#FFD23F" stroke="#2B1B3D" strokeWidth="1" />
      <circle cx="47" cy="3.5" r="1.4" fill="#FFD23F" stroke="#2B1B3D" strokeWidth="1" />
      <circle cx="23" cy="33" r="3.3" fill="#2B1B3D" />
      <circle cx="39" cy="33" r="3.3" fill="#2B1B3D" />
      <circle cx="24.2" cy="31.8" r="1" fill="white" />
      <circle cx="40.2" cy="31.8" r="1" fill="white" />
      <circle cx="17.5" cy="40" r="3" fill="#F2542D" opacity="0.55" />
      <circle cx="45" cy="40" r="3" fill="#F2542D" opacity="0.55" />
      {mood === "happy" && <path d="M23 42 Q31 50 40 42" fill="none" stroke="#2B1B3D" strokeWidth="3" strokeLinecap="round" />}
      {mood === "wow" && <ellipse cx="31.5" cy="44" rx="4" ry="4.5" fill="#2B1B3D" />}
      {mood === "hungry" && (
        <>
          <path d="M24 43 Q31 39 39 43" fill="none" stroke="#2B1B3D" strokeWidth="3" strokeLinecap="round" />
          <path d="M33 43 q2 6 0 7 q-2 -1 0 -7" fill="#7DD3FC" stroke="#2B1B3D" strokeWidth="1" />
        </>
      )}
    </svg>
  );
}

export function Logo({ size = 40, showDescriptor = false }: { size?: number; showDescriptor?: boolean }) {
  const { locale, t } = useI18n();
  return (
    <span className="inline-flex items-center gap-2">
      <Lugma size={size} />
      <span className="flex flex-col leading-none">
        {/* Wordmark: the name in ink + a pomegranate "bite dot". Arabic stays one unbroken word so letters keep joining. */}
        <span className="inline-flex items-end gap-0.5 font-display text-[1.7rem] font-extrabold tracking-tight">
          <span>{locale === "ar" ? "أكلة" : "akla"}</span>
          <span className="mb-[0.42em] inline-block size-[0.3em] rounded-full bg-brand ring-2 ring-sun" aria-hidden />
        </span>
        {showDescriptor && <span className="text-xs font-semibold text-ink-soft">{t.brand.descriptor}</span>}
      </span>
    </span>
  );
}
