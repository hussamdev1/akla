"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, SlidersHorizontal } from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { GOVERNORATES, areaById } from "@/data/geo";
import { MEALS } from "@/data/meals";
import { RESTAURANTS } from "@/data/restaurants";
import { useI18n } from "@/lib/i18n";
import { useDistances, useNow, useOffers } from "@/lib/hooks";
import { norm } from "@/lib/search";
import { openState } from "@/lib/time";
import type { CategoryId } from "@/lib/types";
import { RestaurantCard } from "@/components/cards";
import { Container, EmptyState, PageHero, Sheet, Toggle } from "@/components/ui";

type Sort = "recommended" | "rating" | "distance" | "price";

export function RestaurantsView() {
  const { t, l } = useI18n();
  const dist = useDistances();
  const { active } = useOffers();
  const now = useNow(60_000);
  const [q, setQ] = useState("");
  const [cats, setCats] = useState<CategoryId[]>([]);
  const [gov, setGov] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [price, setPrice] = useState<number[]>([]);
  const [maxKm, setMaxKm] = useState(60);
  const [openNow, setOpenNow] = useState(false);
  const [withOffers, setWithOffers] = useState(false);
  const [delivery, setDelivery] = useState(false);
  const [dineIn, setDineIn] = useState(false);
  const [sort, setSort] = useState<Sort>("recommended");
  const [sheet, setSheet] = useState(false);

  const offerCount = useMemo(() => {
    const m: Record<string, number> = {};
    for (const o of active) m[o.restaurantId] = (m[o.restaurantId] ?? 0) + 1;
    return m;
  }, [active]);

  const list = useMemo(() => {
    const nq = norm(q);
    const out = RESTAURANTS.filter((r) => {
      if (nq) {
        const meals = MEALS.filter((m) => m.restaurantId === r.id);
        const hay = [r.name.ar, r.name.en, r.tagline.ar, r.tagline.en, ...meals.flatMap((m) => [m.name.ar, m.name.en])].map(norm).join(" ");
        if (!hay.includes(nq)) return false;
      }
      if (cats.length && !r.categories.some((c) => cats.includes(c))) return false;
      if (gov && areaById(r.areaId)?.governorate !== gov) return false;
      if (minRating && (r.rating ?? 0) < minRating) return false;
      if (price.length && !price.includes(r.priceLevel)) return false;
      if (maxKm < 60 && dist[r.id] > maxKm) return false;
      if (openNow && (!now || openState(r.hours, now).status !== "open")) return false;
      if (withOffers && !offerCount[r.id]) return false;
      if (delivery && !r.delivery) return false;
      if (dineIn && !r.dineIn) return false;
      return true;
    });
    const score = (id: string) => {
      const r = RESTAURANTS.find((x) => x.id === id)!;
      return (r.rating ?? 4) * 2 + (offerCount[id] ?? 0) + (r.featured ? 1.5 : 0) - dist[id] * 0.1;
    };
    const cmp: Record<Sort, (a: (typeof out)[number], b: (typeof out)[number]) => number> = {
      recommended: (a, b) => score(b.id) - score(a.id),
      rating: (a, b) => (b.rating ?? -1) - (a.rating ?? -1),
      distance: (a, b) => dist[a.id] - dist[b.id],
      price: (a, b) => a.priceLevel - b.priceLevel,
    };
    return out.sort(cmp[sort]);
  }, [q, cats, gov, minRating, price, maxKm, openNow, withOffers, delivery, dineIn, sort, dist, now, offerCount]);

  const filters = (
    <div className="space-y-5">
      <div>
        <h3 className="mb-2 font-bold">{t.nearby.cuisine}</h3>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" className="chip !px-2.5 !py-1 !text-xs" aria-pressed={cats.includes(c.id)} onClick={() => setCats((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]))}>
              {c.emoji} {l(c.name)}
            </button>
          ))}
        </div>
      </div>
      <label className="block text-sm font-bold">
        {t.offersPage.filterArea}
        <select className="input mt-1" value={gov} onChange={(e) => setGov(e.target.value)}>
          <option value="">{t.common.all}</option>
          {GOVERNORATES.map((g) => <option key={g.id} value={g.id}>{l(g.name)}</option>)}
        </select>
      </label>
      <div>
        <h3 className="mb-2 font-bold">{t.restaurantsPage.minRating}</h3>
        <div className="flex flex-wrap gap-1.5">
          {[0, 4, 4.3, 4.5].map((v) => (
            <button key={v} type="button" className="chip" aria-pressed={minRating === v} onClick={() => setMinRating(v)}>
              {v === 0 ? t.common.any : `★ ${v}+`}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-bold">{t.restaurantsPage.price}</h3>
        <div className="flex gap-1.5" dir="ltr">
          {[1, 2, 3, 4].map((v) => (
            <button key={v} type="button" className="chip" aria-pressed={price.includes(v)} onClick={() => setPrice((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))}>
              {"$".repeat(v)}
            </button>
          ))}
        </div>
      </div>
      <label className="block text-sm font-bold">
        {t.picker.maxDistance}: <span className="text-brand">{maxKm >= 60 ? t.common.any : `${maxKm} ${t.common.km}`}</span>
        <input type="range" min={1} max={60} value={maxKm} onChange={(e) => setMaxKm(Number(e.target.value))} className="mt-2 w-full accent-brand" />
      </label>
      <div className="space-y-3 rounded-2xl border-2 border-ink bg-white p-3">
        <Toggle checked={openNow} onChange={setOpenNow} label={`🟢 ${t.restaurantsPage.openNow}`} />
        <Toggle checked={withOffers} onChange={setWithOffers} label={`🏷️ ${t.restaurantsPage.withOffers}`} />
        <Toggle checked={delivery} onChange={setDelivery} label={`🛵 ${t.common.delivery}`} />
        <Toggle checked={dineIn} onChange={setDineIn} label={`🪑 ${t.common.dineIn}`} />
      </div>
    </div>
  );

  return (
    <>
      <PageHero title={t.restaurantsPage.title} subtitle={t.restaurantsPage.subtitle} emoji="🍽️" color="#FFD23F">
        <label className="sticker relative flex max-w-2xl items-center">
          <Search className="absolute start-4 size-5 text-ink-soft" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.restaurantsPage.searchPh} className="w-full rounded-[1.5rem] bg-transparent py-3.5 ps-12 pe-4 text-lg font-medium outline-none" />
        </label>
      </PageHero>
      <Container className="py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="font-bold">{t.common.results(list.length)}</p>
          <div className="flex items-center gap-2">
            <select className="input !w-auto !py-1.5 text-sm font-bold" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label={t.common.sort}>
              {(Object.keys(t.restaurantsPage.sort) as Sort[]).map((k) => <option key={k} value={k}>{t.restaurantsPage.sort[k]}</option>)}
            </select>
            <button type="button" className="btn btn-light btn-sm lg:hidden" onClick={() => setSheet(true)}>
              <SlidersHorizontal className="size-4" /> {t.common.filters}
            </button>
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
          <aside className="sticker hidden h-fit p-4 lg:block">{filters}</aside>
          {list.length ? (
            <motion.div layout className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {list.map((r) => (
                  <motion.div key={r.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
                    <RestaurantCard r={r} km={dist[r.id]} offers={offerCount[r.id] ?? 0} featuredMeal={MEALS.find((m) => m.restaurantId === r.id && m.editorsPick)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <EmptyState title={t.common.noResults} />
          )}
        </div>
      </Container>
      <Sheet open={sheet} onClose={() => setSheet(false)} title={t.common.filters}>
        {filters}
        <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => setSheet(false)}>
          {t.common.apply} · {t.common.results(list.length)}
        </button>
      </Sheet>
    </>
  );
}


