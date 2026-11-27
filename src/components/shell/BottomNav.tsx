"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { Gamepad2, Home, LayoutGrid, MapPin, Tag } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cx, Sheet } from "../ui";
import { Lugma } from "../Logo";

export function BottomNav() {
  const { t } = useI18n();
  const path = usePathname();
  const [more, setMore] = useState(false);
  const is = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));

  const item = (href: string, label: string, Icon: typeof Home) => (
    <Link href={href} className={cx("flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-bold", is(href) ? "text-brand" : "text-ink/70")}>
      <Icon className="size-5" strokeWidth={is(href) ? 2.6 : 2} />
      {label}
    </Link>
  );

  const all = [
    { href: "/", label: t.nav.home, e: "🏠" },
    { href: "/discover/", label: t.nav.discover, e: "🧭" },
    { href: "/restaurants/", label: t.nav.restaurants, e: "🍽️" },
    { href: "/offers/", label: t.nav.offers, e: "🏷️" },
    { href: "/nearby/", label: t.nav.nearby, e: "📍" },
    { href: "/picker/", label: t.nav.picker, e: "🎡" },
    { href: "/games/", label: t.nav.games, e: "🎮" },
    { href: "/favorites/", label: t.nav.favorites, e: "❤️" },
    { href: "/trending/", label: t.nav.trending, e: "🔥" },
    { href: "/compare/", label: t.nav.compare, e: "⚖️" },
    { href: "/games/challenges/", label: t.nav.challenges, e: "🎯" },
    { href: "/profile/", label: t.nav.profile, e: "🏅" },
  ];

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-ink bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Mobile">
        <div className="relative mx-auto flex max-w-md items-end">
          {item("/", t.nav.home, Home)}
          {item("/offers/", t.nav.offers, Tag)}
          <div className="flex flex-1 justify-center">
            <Link href="/picker/" aria-label={t.nav.picker} className="-mt-7 flex flex-col items-center gap-0.5 text-[11px] font-extrabold">
              <motion.span whileTap={{ rotate: 180, scale: 0.9 }} className="grid size-16 place-items-center rounded-full border-2 border-ink bg-brand shadow-[3px_3px_0_#2B1B3D]">
                <Lugma size={44} />
              </motion.span>
              <span className={is("/picker") ? "text-brand" : ""}>{t.nav.spin}</span>
            </Link>
          </div>
          {item("/nearby/", t.nav.nearby, MapPin)}
          <button type="button" onClick={() => setMore(true)} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-bold text-ink/70">
            <LayoutGrid className="size-5" />
            {t.nav.more}
          </button>
        </div>
      </nav>
      <Sheet open={more} onClose={() => setMore(false)} title={t.nav.more}>
        <div className="grid grid-cols-2 gap-2 min-[370px]:grid-cols-3 sm:gap-3">
          {all.map((a) => (
            <Link key={a.href} href={a.href} onClick={() => setMore(false)} className="sticker flex min-w-0 flex-col items-center gap-1 p-2 text-center text-sm font-bold sm:p-3">
              <span className="text-2xl">{a.e}</span>
              {a.label}
            </Link>
          ))}
        </div>
        <Link href="/games/" onClick={() => setMore(false)} className="btn btn-lagoon mt-4 w-full">
          <Gamepad2 className="size-5" /> {t.home.play}
        </Link>
      </Sheet>
    </>
  );
}
