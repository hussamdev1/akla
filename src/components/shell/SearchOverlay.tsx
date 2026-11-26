"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { searchAll } from "@/lib/search";
import { CATEGORIES } from "@/data/categories";
import { MiniMealRow } from "../cards";
import { FoodImage, Sheet } from "../ui";

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { t, l } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const path = usePathname();

  useEffect(() => {
    const onOpen = (e: Event) => {
      setOpen(true);
      const detail = (e as CustomEvent<string | undefined>).detail;
      if (typeof detail === "string") setQ(detail);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("akla:search", onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("akla:search", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- close on navigation
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 80);
  }, [open]);

  const res = useMemo(() => searchAll(q), [q]);
  const close = () => setOpen(false);
  const empty = q && !res.categories.length && !res.restaurants.length && !res.meals.length;

  return (
    <Sheet open={open} onClose={close} title={t.search.title} wide>
      <label className="relative block">
        <Search className="absolute start-3 top-1/2 size-5 -translate-y-1/2 text-ink-soft" />
        <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.header.searchPlaceholder} className="input ps-11 text-lg" />
      </label>

      {!q && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-bold text-ink-soft">{t.search.recent}</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.slice(0, 10).map((c) => (
              <button key={c.id} type="button" className="chip" onClick={() => setQ(l(c.name))}>
                {c.emoji} {l(c.name)}
              </button>
            ))}
          </div>
        </div>
      )}

      {empty && <p className="mt-6 text-center font-semibold text-ink-soft">{t.search.none}</p>}

      {res.categories.length > 0 && (
        <section className="mt-5">
          <h3 className="mb-2 text-sm font-bold text-ink-soft">{t.search.categories}</h3>
          <div className="flex flex-wrap gap-2">
            {res.categories.map((c) => (
              <Link key={c.id} href={`/discover/?c=${c.id}`} onClick={close} className="chip" style={{ background: c.color }}>
                {c.emoji} {l(c.name)}
              </Link>
            ))}
          </div>
        </section>
      )}
      {res.restaurants.length > 0 && (
        <section className="mt-5">
          <h3 className="mb-2 text-sm font-bold text-ink-soft">{t.search.restaurants}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {res.restaurants.map((r) => (
              <Link key={r.id} href={`/restaurants/${r.id}/`} onClick={close} className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-white p-2 hover:bg-rice-deep">
                <FoodImage src={r.cover} emoji={r.emoji} alt="" size="small" className="size-12 rounded-xl border-2 border-ink" />
                <div className="min-w-0">
                  <div className="truncate font-bold">{l(r.name)}</div>
                  <div className="truncate text-sm text-ink-soft">{l(r.tagline)}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      {res.meals.length > 0 && (
        <section className="mt-5">
          <h3 className="mb-2 text-sm font-bold text-ink-soft">{t.search.meals}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {res.meals.map((m) => (
              <Link key={m.id} href={`/restaurants/${m.restaurantId}/#meal-${m.id}`} onClick={close} className="rounded-2xl border-2 border-ink bg-white p-2 hover:bg-rice-deep">
                <MiniMealRow m={m} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </Sheet>
  );
}
