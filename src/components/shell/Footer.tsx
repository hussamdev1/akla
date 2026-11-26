"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Logo } from "../Logo";

export function Footer() {
  const { t } = useI18n();
  const links = [
    ["/discover/", t.nav.discover], ["/restaurants/", t.nav.restaurants], ["/offers/", t.nav.offers], ["/nearby/", t.nav.nearby],
    ["/picker/", t.nav.picker], ["/games/", t.nav.games], ["/trending/", t.nav.trending], ["/compare/", t.nav.compare],
    ["/favorites/", t.nav.favorites], ["/profile/", t.nav.profile],
  ];
  return (
    <footer className="relative mt-16 border-t-2 border-ink bg-ink pb-28 text-white lg:pb-0">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <div className="inline-block rounded-2xl bg-rice px-3 py-2 text-ink">
            <Logo size={34} showDescriptor />
          </div>
          <p className="text-white/80">{t.footer.about}</p>
          <p className="font-display text-xl text-sun">{t.brand.tagline}</p>
        </div>
        <nav className="grid grid-cols-2 gap-2 text-white/85">
          {links.map(([h, label]) => (
            <Link key={h} href={h} className="hover:text-sun">
              {label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 text-sm text-white/75">
          <h3 className="font-display text-lg text-white">{t.footer.data}</h3>
          <p>🧪 {t.footer.demo}</p>
          <p>
            📸 {t.footer.credits.split("TheMealDB")[0]}
            <a className="underline" href="https://www.themealdb.com" target="_blank" rel="noreferrer">
              TheMealDB
            </a>
            {t.footer.credits.split("TheMealDB")[1]?.split("OpenStreetMap")[0]}
            <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
              OpenStreetMap
            </a>
            {t.footer.credits.split("OpenStreetMap")[1]}
          </p>
          <p className="pt-2 text-white">{t.footer.made}</p>
        </div>
      </div>
    </footer>
  );
}
