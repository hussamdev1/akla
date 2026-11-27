"use client";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { BadgeCheck, Clock, FlaskConical, Heart, MapPin, Star, Users, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useFav, useStore } from "@/lib/store";
import { countdownParts, openState } from "@/lib/time";
import { sized } from "@/lib/img";
import { sfx } from "@/lib/fx";
import { useMounted, useNow } from "@/lib/hooks";
import type { FavKind, WeeklyHours } from "@/lib/types";
import { Lugma } from "./Logo";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/* ---------- Layout ---------- */

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("mx-auto w-full max-w-7xl px-4 sm:px-6", className)}>{children}</div>;
}

export function PageHero({ title, subtitle, emoji, color = "#FFD23F", children }: { title: string; subtitle?: string; emoji?: string; color?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b-2 border-ink" style={{ background: color }}>
      <div className="dots-bg absolute inset-0 opacity-60" />
      <Container className="relative py-8 sm:py-12">
        <div className="flex items-center gap-4">
          {emoji && (
            <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} className="sticker grid size-16 shrink-0 place-items-center text-4xl sm:size-20 sm:text-5xl">
              {emoji}
            </motion.span>
          )}
          <div>
            <motion.h1 initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
              {title}
            </motion.h1>
            {subtitle && <p className="mt-1 max-w-2xl text-base font-medium text-ink/80 sm:text-lg">{subtitle}</p>}
          </div>
        </div>
        {children && <div className="mt-6">{children}</div>}
      </Container>
    </section>
  );
}

export function SectionHeader({ title, subtitle, href, action, emoji }: { title: string; subtitle?: string; href?: string; action?: string; emoji?: string }) {
  const { t } = useI18n();
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-48 flex-1">
        <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
          {emoji && <span className="me-2 inline-block animate-wiggle">{emoji}</span>}
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-ink-soft">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="btn btn-light btn-sm shrink-0">
          {action ?? t.common.seeAll}
          <span className="rtl:rotate-180">→</span>
        </Link>
      )}
    </div>
  );
}

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 200, damping: 24, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Subtle 3D tilt that follows the pointer. */
export function Tilt({ children, className, max = 8 }: { children: ReactNode; className?: string; max?: number }) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rx = useSpring(useTransform(y, [0, 1], [max, -max]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(x, [0, 1], [-max, max]), { stiffness: 200, damping: 18 });
  return (
    <motion.div
      className={className}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 800 }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width);
        y.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        x.set(0.5);
        y.set(0.5);
      }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Media ---------- */

/** `cors`: request the image with CORS so the service worker can keep it for offline use (only for hosts that allow it). */
export function FoodImage({ src, emoji, alt, size = "medium", className, color = "#FFE3C9", cors, eager }: { src?: string; emoji: string; alt: string; size?: "small" | "medium" | "large" | "full"; className?: string; color?: string; cors?: boolean; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  const url = sized(src, size);
  if (!url || failed) {
    return (
      <div className={cx("relative grid place-items-center overflow-hidden", className)} style={{ background: `radial-gradient(circle at 30% 30%, white, ${color})` }} role="img" aria-label={alt}>
        <div className="dots-bg absolute inset-0 opacity-50" />
        <span className="relative text-[4rem] drop-shadow-[3px_3px_0_rgba(43,27,61,0.25)]">{emoji}</span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" crossOrigin={cors ? "anonymous" : undefined} onError={() => setFailed(true)} className={cx("object-cover", className)} />;
}

/* ---------- Badges ---------- */

/** Shows where data comes from: 🧪 demo, 🗺️ OpenStreetMap. Real partner listings need no badge. */
export function DemoBadge({ className, source = "demo" }: { className?: string; source?: "demo" | "osm" | "partner" | "community" }) {
  const { t } = useI18n();
  if (source === "partner" || source === "community") return null;
  if (source === "osm")
    return (
      <span className={cx("inline-flex items-center gap-1 rounded-full border border-lagoon/40 bg-white/90 px-2 py-0.5 text-[11px] font-bold text-lagoon backdrop-blur", className)}>
        🗺️ {t.places.badge}
      </span>
    );
  return (
    <span title={t.common.demoData} className={cx("inline-flex items-center gap-1 rounded-full border border-ink/30 bg-white/90 px-2 py-0.5 text-[11px] font-bold text-ink-soft backdrop-blur", className)}>
      <FlaskConical className="size-3" /> {t.common.demo}
    </span>
  );
}

export function TrustBadge({ verified }: { verified: boolean }) {
  const { t } = useI18n();
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-lime/20 px-2 py-0.5 text-xs font-bold text-emerald-800">
      <BadgeCheck className="size-3.5" /> {t.common.verified}
    </span>
  ) : (
    <span title={t.common.unverified} className="inline-flex items-center gap-1 rounded-full bg-sun/30 px-2 py-0.5 text-xs font-bold text-amber-800">
      <Users className="size-3.5" /> {t.common.community}
    </span>
  );
}

export function RatingBadge({ rating, count, compact }: { rating?: number; count?: number; compact?: boolean }) {
  const { t } = useI18n();
  if (rating === undefined) return <span className="text-xs font-semibold text-ink-soft">{t.common.ratingUnknown}</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-bold">
      <Star className="size-4 fill-sun text-ink" strokeWidth={1.5} />
      {rating.toFixed(1)}
      {!compact && count !== undefined && <span className="font-medium text-ink-soft">({t.common.reviews(count)})</span>}
    </span>
  );
}

export function PriceLevel({ level }: { level: 1 | 2 | 3 | 4 }) {
  return (
    <span className="text-sm font-bold tracking-wider" aria-label={`price level ${level} of 4`} dir="ltr">
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={i <= level ? "text-ink" : "text-ink/25"}>
          $
        </span>
      ))}
    </span>
  );
}

/** Open / closed now. `tz` is the place's time zone (defaults to the selected city's). */
export function OpenBadge({ hours, tz }: { hours?: WeeklyHours; tz?: string }) {
  const now = useNow(60_000);
  const { t, clock, region } = useI18n();
  if (!now) return <span className="inline-block h-5 w-16 animate-pulse rounded-full bg-ink/10" />;
  const s = openState(hours, now, tz ?? region.timeZone);
  if (s.status === "unknown")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-ink/8 px-2 py-0.5 text-xs font-bold text-ink-soft">
        <Clock className="size-3" /> {t.common.hoursUnknown}
      </span>
    );
  if (s.status === "open")
    return (
      <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold", s.closingSoon ? "bg-sun/40 text-amber-900" : "bg-lime/25 text-emerald-800")}>
        <span className={cx("size-2 rounded-full", s.closingSoon ? "bg-amber-500" : "bg-lime animate-pulse")} />
        {s.closingSoon ? t.common.closingSoon : t.common.open} · {t.common.closesAt(clock(s.closesAt))}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-chili/15 px-2 py-0.5 text-xs font-bold text-red-700">
      <span className="size-2 rounded-full bg-chili" />
      {t.common.closed}
      {s.opensAt && <> · {t.common.opensAt(clock(s.opensAt))}</>}
    </span>
  );
}

export function DistanceTag({ km }: { km?: number }) {
  const { km: f } = useI18n();
  if (km === undefined) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft">
      <MapPin className="size-3.5" /> {f(km)}
    </span>
  );
}

/* ---------- Actions ---------- */

export function FavButton({ kind, id, className, size = "md" }: { kind: FavKind; id: string; className?: string; size?: "sm" | "md" }) {
  const fav = useFav(kind, id);
  const toggle = useStore((s) => s.toggleFav);
  const { t } = useI18n();
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.8 }}
      aria-pressed={fav}
      aria-label={fav ? t.common.saved : t.common.save}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (toggle(kind, id)) sfx.pop();
      }}
      className={cx("hit grid place-items-center rounded-full border-2 border-ink bg-white shadow-[2px_2px_0_#2B1B3D] transition-colors", size === "sm" ? "size-8" : "size-10", fav && "bg-chili", className)}
    >
      <motion.span key={String(fav)} initial={{ scale: 0.4 }} animate={{ scale: 1 }}>
        <Heart className={cx(size === "sm" ? "size-4" : "size-5", fav ? "fill-white text-white" : "text-ink")} />
      </motion.span>
    </motion.button>
  );
}

/* ---------- Countdown ---------- */

export function Countdown({ to, compact, label }: { to: string; compact?: boolean; label?: string }) {
  const now = useNow(1000);
  const { t, locale } = useI18n();
  if (!now) return <span className="inline-block h-5 w-20 animate-pulse rounded bg-ink/10" />;
  const ms = +new Date(to) - +now;
  if (ms <= 0) return <span className="font-bold text-ink-soft">{t.common.ended}</span>;
  const { d, h, m, s } = countdownParts(ms);
  const urgent = ms < 3 * 3600e3;
  const p2 = (n: number) => String(n).padStart(2, "0");
  const clockText = d > 0 ? `${p2(h)}:${p2(m)}` : `${p2(h)}:${p2(m)}:${p2(s)}`;
  const days = d > 0 ? (locale === "ar" ? `${d} يوم` : `${d}d`) : null;
  return (
    <span className={cx("inline-flex items-center gap-1.5 font-bold", urgent ? "text-chili" : "text-ink")}>
      {label && <span className="text-xs font-semibold text-ink-soft">{label}</span>}
      <Clock className={cx("size-3.5", urgent && "animate-wiggle")} />
      {days && <span>{days}</span>}
      <span dir="ltr" className={cx("tabular-nums", !compact && "rounded-md bg-ink/5 px-1")}>
        {clockText}
      </span>
    </span>
  );
}

/* ---------- Feedback ---------- */

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="sticker mx-auto flex max-w-md flex-col items-center gap-3 p-8 text-center">
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2.4 }}>
        <Lugma size={84} mood="hungry" />
      </motion.div>
      <h3 className="font-display text-2xl font-bold">{title}</h3>
      {body && <p className="text-ink-soft">{body}</p>}
      {action}
    </div>
  );
}

export function Loader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10" role="status">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}>
        <Lugma size={56} mood="wow" />
      </motion.div>
      {label && <p className="font-semibold text-ink-soft">{label}</p>}
    </div>
  );
}

let openSheets = 0; // sheets can stack (e.g. install help inside the More sheet); unlock scroll when the last closes

export function Sheet({ open, onClose, children, title, wide }: { open: boolean; onClose: () => void; children: ReactNode; title?: string; wide?: boolean }) {
  const { t } = useI18n();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    openSheets++;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      if (--openSheets === 0) document.body.style.overflow = "";
    };
  }, [open, onClose]);
  const mounted = useMounted();
  if (!mounted) return null;
  // Portal to <body>: an ancestor with backdrop-filter/transform (the sticky header) would otherwise become the
  // containing block of this `fixed` overlay and clip it to the header.
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className={cx("sticker relative max-h-[92dvh] w-full overflow-y-auto rounded-b-none bg-rice sm:rounded-b-[1.5rem]", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b-2 border-ink bg-rice/95 px-5 py-3 backdrop-blur">
              <h2 className="font-display text-xl font-bold">{title}</h2>
              <button onClick={onClose} className="hit grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-white" aria-label={t.common.close}>
                <X className="size-4" />
              </button>
            </div>
            <div className="p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 font-semibold">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cx("hit h-7 w-12 shrink-0 rounded-full border-2 border-ink transition-colors", checked ? "bg-lime" : "bg-white")}
      >
        <motion.span layout className={cx("absolute top-0.5 size-5 rounded-full border-2 border-ink bg-white", checked ? "end-0.5" : "start-0.5")} />
      </button>
    </label>
  );
}
