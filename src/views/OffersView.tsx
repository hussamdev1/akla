"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Send, SlidersHorizontal } from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { AREAS } from "@/data/geo";
import { mealById } from "@/data/meals";
import { RESTAURANTS, restaurantById } from "@/data/restaurants";
import { useI18n } from "@/lib/i18n";
import { useDistances, useOffers } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import type { Offer, OfferType } from "@/lib/types";
import { OfferCard } from "@/components/cards";
import { Container, Countdown, cx, EmptyState, PageHero, Sheet, Toggle } from "@/components/ui";

type Cat = "all" | "best" | "bogo" | "u2" | "u3" | "u5" | "family" | "burger" | "pizza" | "chicken" | "lunch" | "dinner" | "delivery" | "exclusive";
const CAT_EMOJI: Record<Cat, string> = { all: "✨", best: "💥", bogo: "🎁", u2: "🪙", u3: "💵", u5: "💰", family: "👨‍👩‍👧", burger: "🍔", pizza: "🍕", chicken: "🍗", lunch: "🍱", dinner: "🌙", delivery: "🛵", exclusive: "💎" };
type Sort = "discount" | "price" | "closest" | "rating" | "popular" | "recent" | "ending";

function matches(o: Offer, c: Cat) {
  const r = restaurantById(o.restaurantId)!;
  const m = o.mealId ? mealById(o.mealId) : undefined;
  const p = o.finalPrice;
  switch (c) {
    case "all": return true;
    case "best": return (o.percent ?? 0) >= 30;
    case "bogo": return o.type === "bogo";
    case "u2": return p !== undefined && p < 2;
    case "u3": return p !== undefined && p < 3;
    case "u5": return p !== undefined && p < 5;
    case "family": return o.type === "family" || m?.size === "family";
    case "burger": return r.categories.includes("burgers");
    case "pizza": return r.categories.includes("pizza");
    case "chicken": return r.categories.includes("fried-chicken") || /chicken|دجاج/i.test(o.title.en + (m?.name.en ?? ""));
    case "lunch": return o.tags.includes("lunch");
    case "dinner": return o.tags.includes("dinner");
    case "delivery": return o.type === "free-delivery";
    case "exclusive": return o.tags.includes("exclusive");
  }
}

export function OffersView() {
  const { t, l } = useI18n();
  const { active, upcoming, expired } = useOffers();
  const dist = useDistances();
  const [cat, setCat] = useState<Cat>("all");
  const [sort, setSort] = useState<Sort>("discount");
  const [cuisine, setCuisine] = useState("");
  const [area, setArea] = useState("");
  const [rest, setRest] = useState("");
  const [maxPrice, setMaxPrice] = useState(20);
  const [type, setType] = useState<OfferType | "">("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);

  const list = useMemo(() => {
    const out = active.filter((o) => {
      const r = restaurantById(o.restaurantId)!;
      if (!matches(o, cat)) return false;
      if (cuisine && !r.categories.includes(cuisine as never)) return false;
      if (area && r.areaId !== area) return false;
      if (rest && r.id !== rest) return false;
      if (type && o.type !== type) return false;
      if (verifiedOnly && !o.verified) return false;
      if (o.finalPrice !== undefined && o.finalPrice > maxPrice) return false;
      return true;
    });
    const rating = (o: Offer) => restaurantById(o.restaurantId)!.rating ?? 0;
    const cmp: Record<Sort, (a: Offer, b: Offer) => number> = {
      discount: (a, b) => (b.percent ?? 0) - (a.percent ?? 0),
      price: (a, b) => (a.finalPrice ?? 99) - (b.finalPrice ?? 99),
      closest: (a, b) => dist[a.restaurantId] - dist[b.restaurantId],
      rating: (a, b) => rating(b) - rating(a),
      popular: (a, b) => Number(!!b.editorsPick) - Number(!!a.editorsPick) || (b.percent ?? 0) - (a.percent ?? 0),
      recent: (a, b) => +new Date(b.addedAt) - +new Date(a.addedAt),
      ending: (a, b) => +new Date(a.expiresAt) - +new Date(b.expiresAt),
    };
    return out.sort(cmp[sort]);
  }, [active, cat, cuisine, area, rest, type, verifiedOnly, maxPrice, sort, dist]);

  const advCount = [cuisine, area, rest, type, verifiedOnly, maxPrice < 20].filter(Boolean).length;
  const filters = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
      <label className="text-sm font-bold">
        {t.offersPage.filterCuisine}
        <select className="input mt-1" value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
          <option value="">{t.common.all}</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {l(c.name)}</option>)}
        </select>
      </label>
      <label className="text-sm font-bold">
        {t.offersPage.filterArea}
        <select className="input mt-1" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">{t.common.all}</option>
          {AREAS.map((a) => <option key={a.id} value={a.id}>{l(a.name)}</option>)}
        </select>
      </label>
      <label className="text-sm font-bold">
        {t.offersPage.filterRestaurant}
        <select className="input mt-1" value={rest} onChange={(e) => setRest(e.target.value)}>
          <option value="">{t.common.all}</option>
          {RESTAURANTS.map((r) => <option key={r.id} value={r.id}>{l(r.name)}</option>)}
        </select>
      </label>
      <label className="text-sm font-bold">
        {t.offersPage.cats}
        <select className="input mt-1" value={type} onChange={(e) => setType(e.target.value as OfferType | "")}>
          <option value="">{t.common.all}</option>
          {(Object.keys(t.offerTypes) as OfferType[]).map((k) => <option key={k} value={k}>{t.offerTypes[k]}</option>)}
        </select>
      </label>
      <label className="text-sm font-bold">
        {t.offersPage.maxBudget}: <span className="text-chili">{maxPrice >= 20 ? t.common.any : `${maxPrice} ${t.common.kwd}`}</span>
        <input type="range" min={0.5} max={20} step={0.5} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="mt-2 w-full accent-chili" />
      </label>
      <div className="rounded-2xl border-2 border-ink bg-white p-3">
        <Toggle checked={verifiedOnly} onChange={setVerifiedOnly} label={`✅ ${t.offersPage.verifiedOnly}`} />
      </div>
      <button type="button" className="btn btn-light btn-sm" onClick={() => { setCuisine(""); setArea(""); setRest(""); setType(""); setVerifiedOnly(false); setMaxPrice(20); }}>
        {t.common.reset}
      </button>
    </div>
  );

  return (
    <>
      <PageHero title={t.offersPage.title} subtitle={t.offersPage.subtitle} emoji="🏷️" color="#F2542D">
        <div className="scroll-row !pb-1">
          {(Object.keys(CAT_EMOJI) as Cat[]).map((c) => (
            <motion.button key={c} type="button" whileTap={{ scale: 0.92 }} className="chip !py-2" aria-pressed={cat === c} onClick={() => setCat(c)}>
              {CAT_EMOJI[c]} {c === "all" ? t.common.all : t.offersPage.categories[c]}
            </motion.button>
          ))}
        </div>
      </PageHero>
      <Container className="py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="font-bold">{t.common.results(list.length)}</p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm font-bold">
              {t.common.sort}
              <select className="input !w-auto !py-1.5" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                {(Object.keys(t.offersPage.sorts) as Sort[]).map((k) => <option key={k} value={k}>{t.offersPage.sorts[k]}</option>)}
              </select>
            </label>
            <button type="button" className="btn btn-light btn-sm lg:hidden" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal className="size-4" /> {t.common.filters} {advCount > 0 && `(${advCount})`}
            </button>
            <button type="button" className="btn btn-sun btn-sm" onClick={() => setSubmitOpen(true)}>
              <Send className="size-4" /> {t.offersPage.submit}
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
          <aside className="sticker hidden h-fit p-4 lg:block">
            <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold"><SlidersHorizontal className="size-4" />{t.common.filters}</h2>
            {filters}
          </aside>
          <div>
            {list.length ? (
              <motion.div layout className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {list.map((o) => (
                    <motion.div key={o.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                      <OfferCard o={o} km={dist[o.restaurantId]} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <EmptyState title={t.common.noResults} />
            )}

            {upcoming.length > 0 && (
              <section className="mt-12">
                <h2 className="mb-3 font-display text-2xl font-bold">⏳ {t.offersPage.upcoming}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {upcoming.map((o) => (
                    <div key={o.id} className="sticker flex items-center justify-between gap-3 p-4">
                      <div>
                        <p className="font-bold">{l(o.title)}</p>
                        <p className="text-sm text-ink-soft">{l(restaurantById(o.restaurantId)!.name)}</p>
                      </div>
                      <Countdown to={o.startsAt} compact label={t.common.startsIn} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {expired.length > 0 && (
              <details className="mt-10">
                <summary className="cursor-pointer font-display text-xl font-bold text-ink-soft">🚫 {t.offersPage.expired} ({expired.length})</summary>
                <div className="mt-3 grid gap-3 opacity-60 sm:grid-cols-2">
                  {expired.map((o) => (
                    <div key={o.id} className="rounded-2xl border-2 border-dashed border-ink/40 p-4 grayscale">
                      <p className="font-bold line-through">{l(o.title)}</p>
                      <p className="text-sm">{l(restaurantById(o.restaurantId)!.name)} · {t.common.ended}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
      </Container>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title={t.common.filters}>
        {filters}
        <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => setFiltersOpen(false)}>
          {t.common.apply} · {t.common.results(list.length)}
        </button>
      </Sheet>
      <SubmitOffer open={submitOpen} onClose={() => setSubmitOpen(false)} />
    </>
  );
}

function SubmitOffer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, l } = useI18n();
  const showToast = useStore((s) => s.showToast);
  return (
    <Sheet open={open} onClose={onClose} title={t.offersPage.submit}>
      <p className="mb-4 rounded-2xl bg-sun/30 p-3 text-sm font-semibold">{t.offersPage.submitNote}</p>
      <form
        className={cx("space-y-3")}
        onSubmit={(e) => {
          e.preventDefault();
          showToast(t.common.reportThanks, "📨");
          onClose();
        }}
      >
        <select required className="input" defaultValue="">
          <option value="" disabled>{t.offersPage.filterRestaurant}</option>
          {RESTAURANTS.map((r) => <option key={r.id} value={r.id}>{l(r.name)}</option>)}
        </select>
        <input required className="input" placeholder={t.offersPage.cats} />
        <input className="input" type="url" placeholder="https://instagram.com/…" />
        <input className="input" type="date" aria-label={t.offersPage.expires} />
        <button className="btn btn-primary w-full">
          <Send className="size-4" /> {t.offersPage.submit}
        </button>
      </form>
    </Sheet>
  );
}
