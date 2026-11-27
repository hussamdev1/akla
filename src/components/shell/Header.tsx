"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, FlaskConical, Heart, Search, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { SHOW_DEMO } from "@/data/source";
import { Logo } from "../Logo";
import { cx } from "../ui";
import { LocationPill } from "./LocationPicker";

export const openSearch = () => window.dispatchEvent(new Event("akla:search"));

export function LangToggle({ className }: { className?: string }) {
  const { t, locale } = useI18n();
  const setLocale = useStore((s) => s.setLocale);
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
      className={cx("hit rounded-full border-2 border-ink bg-sun px-3 py-1.5 text-sm font-extrabold shadow-[2px_2px_0_#2B1B3D] transition-transform active:translate-y-0.5", className)}
      lang={locale === "ar" ? "en" : "ar"}
    >
      {t.header.language}
    </button>
  );
}

export function Header() {
  const { t } = useI18n();
  const path = usePathname();
  const [more, setMore] = useState(false);
  const favCount = useStore((s) => s.favorites.restaurants.length + s.favorites.meals.length + s.favorites.offers.length);

  const nav = [
    { href: "/discover/", label: t.nav.discover },
    { href: "/restaurants/", label: t.nav.restaurants },
    { href: "/offers/", label: t.nav.offers },
    { href: "/nearby/", label: t.nav.nearby },
    { href: "/games/", label: t.nav.games },
  ];
  const extra = [
    { href: "/trending/", label: t.nav.trending, emoji: "🔥" },
    { href: "/compare/", label: t.nav.compare, emoji: "⚖️" },
    { href: "/games/challenges/", label: t.nav.challenges, emoji: "🎯" },
    { href: "/discover/#budget", label: t.discover.budget, emoji: "💰" },
    { href: "/profile/", label: t.nav.profile, emoji: "🏅" },
  ];
  const active = (h: string) => (h === "/" ? path === "/" : path.startsWith(h.replace(/\/$/, "")));

  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-rice/90 backdrop-blur-md">
      {SHOW_DEMO && (
        <div className="flex items-center justify-center gap-2 bg-ink px-3 py-1 text-center text-[11px] font-semibold text-white/90 sm:text-xs">
          <FlaskConical className="size-3.5 shrink-0 text-sun" />
          <span className="line-clamp-1">{t.demoBanner}</span>
        </div>
      )}
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="Akla home">
          <Logo size={38} />
        </Link>

        <nav className="ms-2 hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={cx("relative whitespace-nowrap rounded-full px-3 py-1.5 font-semibold transition-colors hover:bg-white", active(n.href) && "text-brand")}>
              {n.label}
              {active(n.href) && <motion.span layoutId="nav-dot" className="absolute inset-x-3 -bottom-0.5 h-1 rounded-full bg-brand" />}
            </Link>
          ))}
          <div className="relative">
            <button type="button" onClick={() => setMore((v) => !v)} onBlur={() => setTimeout(() => setMore(false), 150)} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold hover:bg-white" aria-expanded={more}>
              {t.nav.more} <ChevronDown className="size-4" />
            </button>
            {more && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="sticker absolute start-0 top-11 z-50 w-56 p-2">
                {extra.map((e) => (
                  <Link key={e.href} href={e.href} className="flex items-center gap-2 rounded-xl px-3 py-2 font-semibold hover:bg-rice">
                    <span>{e.emoji}</span> {e.label}
                  </Link>
                ))}
              </motion.div>
            )}
          </div>
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <button type="button" onClick={openSearch} className="hidden items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-1.5 text-sm text-ink-soft xl:inline-flex" aria-label={t.nav.search}>
            <Search className="size-4" />
            <span className="w-24 truncate text-start 2xl:w-40">{t.nav.search}…</span>
            <kbd className="rounded border border-ink/30 px-1 text-[10px]">⌘K</kbd>
          </button>
          <button type="button" onClick={openSearch} className="hit grid size-9 place-items-center rounded-full border-2 border-ink bg-white xl:hidden" aria-label={t.nav.search}>
            <Search className="size-4" />
          </button>
          <span className="hidden sm:inline-flex">
            <LocationPill />
          </span>
          <Link href="/favorites/" className="hit hidden size-9 place-items-center rounded-full border-2 border-ink bg-white sm:grid" aria-label={t.nav.favorites}>
            <Heart className="size-4" />
            {favCount > 0 && <span className="absolute -end-1.5 -top-1.5 grid size-5 place-items-center rounded-full border-2 border-ink bg-chili text-[10px] font-bold text-white">{favCount}</span>}
          </Link>
          <Link href="/profile/" className="hidden size-9 place-items-center rounded-full border-2 border-ink bg-white 2xl:grid" aria-label={t.nav.profile}>
            <User className="size-4" />
          </Link>
          <LangToggle />
          <Link href="/picker/" className="btn btn-primary btn-sm hidden xl:inline-flex">
            🎡 {t.nav.picker}
          </Link>
        </div>
      </div>
      <div className="flex justify-center pb-2 sm:hidden">
        <LocationPill />
      </div>
    </header>
  );
}
