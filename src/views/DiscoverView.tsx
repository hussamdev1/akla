"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Users } from "lucide-react";
import { CATEGORIES, categoryById } from "@/data/categories";
import { MEALS } from "@/data/meals";
import { HAS_MEALS } from "@/data/live";
import { LiveSoon } from "@/components/LiveSoon";
import { restaurantById } from "@/data/restaurants";
import { useI18n } from "@/lib/i18n";
import { useDistances, useNow, useOffers } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { mealTimeAt } from "@/lib/time";
import type { CategoryId, Meal, MealSize, MealTime, Mood } from "@/lib/types";
import { CategoryCard, MealCard } from "@/components/cards";
import { Container, cx, EmptyState, PageHero, Reveal, SectionHeader } from "@/components/ui";
import { QueryParam } from "@/components/QueryParam";

const TIMES: { id: MealTime; e: string }[] = [
  { id: "breakfast", e: "🍳" }, { id: "morning", e: "🥐" }, { id: "lunch", e: "🍱" }, { id: "afternoon", e: "🧋" }, { id: "dinner", e: "🌙" }, { id: "late", e: "🌃" },
];
const MOOD_E: Record<Mood, string> = { starving: "🤤", delicious: "😋", cheap: "🪙", healthy: "🥗", spicy: "🌶️", comfort: "🛋️", sweet: "🍰", surprise: "🎁", new: "🧭" };
const SERVES: Record<MealSize, number> = { snack: 0.5, regular: 1, large: 1.5, family: 4 };

type BudgetMode = "cheapest" | "value" | "discounts" | "family" | "group";

export function DiscoverView() {
  const { t, l, price } = useI18n();
  const now = useNow(60_000);
  const dist = useDistances();
  const { active } = useOffers();
  const trackCategory = useStore((s) => s.trackCategory);
  const [cat, setCat] = useState<CategoryId | null>(null);
  const [time, setTime] = useState<MealTime | "all">("all");
  const [mood, setMood] = useState<Mood | null>(null);
  const [budget, setBudget] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [bmode, setBmode] = useState<BudgetMode>("cheapest");
  const [people, setPeople] = useState(4);

  const onCat = useCallback((v: string | null) => {
    if (v && CATEGORIES.some((c) => c.id === v)) {
      setCat(v as CategoryId);
      trackCategory(v);
      setTimeout(() => document.getElementById("meals")?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    }
  }, [trackCategory]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value read after hydration (static export)
    if (now && time === "all") setTime(mealTimeAt(now));
    // only on first tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now === null]);

  const offerFor = useMemo(() => Object.fromEntries(active.filter((o) => o.mealId).map((o) => [o.mealId!, o])), [active]);
  const finalPrice = (m: Meal) => offerFor[m.id]?.finalPrice ?? m.price;

  const meals = useMemo(() => {
    return MEALS.filter((m) => {
      if (cat && m.category !== cat && !restaurantById(m.restaurantId)!.categories.includes(cat)) return false;
      if (time !== "all" && !m.times.includes(time)) return false;
      if (mood && mood !== "surprise" && !m.moods.includes(mood)) return false;
      return true;
    }).sort((a, b) => Number(!!b.editorsPick) - Number(!!a.editorsPick) || dist[a.restaurantId] - dist[b.restaurantId]);
  }, [cat, time, mood, dist]);

  const budgetMeals = useMemo(() => {
    if (budget === null) return [];
    const perHead = bmode === "group" || bmode === "family";
    let list = MEALS.filter((m) => {
      const p = finalPrice(m);
      if (bmode === "family") return m.size === "family" && p <= budget;
      if (bmode === "group") return p / SERVES[m.size] <= budget && m.size !== "snack";
      if (bmode === "discounts") return !!offerFor[m.id] && p <= budget;
      return p <= budget;
    });
    const value = (m: Meal) => (SERVES[m.size] * ((restaurantById(m.restaurantId)!.rating ?? 4) / 4)) / finalPrice(m);
    if (bmode === "cheapest") list = list.sort((a, b) => finalPrice(a) - finalPrice(b));
    if (bmode === "value") list = list.sort((a, b) => value(b) - value(a));
    if (bmode === "discounts") list = list.sort((a, b) => (offerFor[b.id]?.percent ?? 0) - (offerFor[a.id]?.percent ?? 0));
    if (perHead) list = list.sort((a, b) => finalPrice(a) / SERVES[a.size] - finalPrice(b) / SERVES[b.size]);
    return list.slice(0, 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budget, bmode, offerFor]);

  const presets = [1, 2, 3, 5, 10];

  if (!HAS_MEALS)
    return (
      <>
        <PageHero title={t.discover.title} subtitle={t.discover.subtitle} emoji="🧭" color="#9BE15D" />
        <Container className="py-10">
          <LiveSoon />
        </Container>
      </>
    );

  return (
    <>
      <QueryParam name="c" onValue={onCat} />
      <PageHero title={t.discover.title} subtitle={t.discover.subtitle} emoji="🧭" color="#9BE15D" />

      <Container className="py-10">
        <div className="scroll-row">
          {CATEGORIES.map((c) => (
            <CategoryCard key={c.id} c={c} size="sm" active={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)} />
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="chip" aria-pressed={time === "all"} onClick={() => setTime("all")}>⏱️ {t.common.all}</button>
            {TIMES.map((x) => (
              <button key={x.id} type="button" className="chip" aria-pressed={time === x.id} onClick={() => setTime(x.id)}>
                {x.e} {t.mealTimes[x.id]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MOOD_E) as Mood[]).filter((m) => m !== "surprise").map((m) => (
              <button key={m} type="button" className="chip" aria-pressed={mood === m} onClick={() => setMood(mood === m ? null : m)}>
                {MOOD_E[m]} {t.moods[m]}
              </button>
            ))}
          </div>
        </div>

        <section id="meals" className="mt-8 scroll-mt-32">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-3xl font-bold">
              {cat ? `${categoryById(cat).emoji} ${l(categoryById(cat).name)}` : t.discover.allMeals}
            </h2>
            <span className="font-bold text-ink-soft">{t.common.results(meals.length)}</span>
          </div>
          {meals.length ? (
            <motion.div layout className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {meals.map((m) => (
                  <motion.div key={m.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                    <MealCard m={m} offer={offerFor[m.id]} km={dist[m.restaurantId]} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <EmptyState title={t.common.noResults} action={<button className="btn btn-primary" onClick={() => { setCat(null); setTime("all"); setMood(null); }}>{t.common.reset}</button>} />
          )}
        </section>
      </Container>

      {/* Budget planner */}
      <section id="budget" className="scroll-mt-28 border-y-2 border-ink bg-sun/40 py-12">
        <Container>
          <Reveal>
            <SectionHeader title={t.discover.budget} subtitle={t.discover.budgetSub} emoji="💰" />
          </Reveal>
          <div className="flex flex-wrap items-center gap-2">
            {presets.map((p) => (
              <motion.button key={p} whileTap={{ scale: 0.9 }} type="button" className="chip !px-4 !py-2 !text-base" aria-pressed={budget === p} onClick={() => { setBudget(p); setCustom(""); }}>
                {t.discover.under(price(p))}
              </motion.button>
            ))}
            <label className="flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-1">
              <span className="text-sm font-bold">{t.discover.custom}</span>
              <input type="number" min={0.25} step={0.25} value={custom} onChange={(e) => { setCustom(e.target.value); setBudget(e.target.value ? Number(e.target.value) : null); }} className="w-20 bg-transparent font-bold outline-none" placeholder="7.5" />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["cheapest", "value", "discounts", "family", "group"] as BudgetMode[]).map((b) => (
              <button key={b} type="button" className={cx("btn btn-sm", bmode === b ? "btn-primary" : "btn-light")} onClick={() => setBmode(b)}>
                {b === "cheapest" ? "🪙" : b === "value" ? "💎" : b === "discounts" ? "🏷️" : b === "family" ? "👨‍👩‍👧" : "👯"} {t.discover[b]}
              </button>
            ))}
            {bmode === "group" && (
              <label className="flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-1 font-bold">
                <Users className="size-4" /> {t.discover.people}
                <input type="number" min={2} max={30} value={people} onChange={(e) => setPeople(Math.max(2, Number(e.target.value)))} className="w-12 bg-transparent outline-none" />
              </label>
            )}
          </div>
          <p className="mt-3 text-sm font-semibold text-ink/75">ℹ️ {t.common.mealPriceOnly}</p>

          {budget !== null && (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {budgetMeals.length ? (
                budgetMeals.map((m) => {
                  const p = finalPrice(m);
                  const servings = bmode === "group" ? Math.ceil(people / SERVES[m.size]) : 1;
                  return (
                    <div key={m.id} className="flex flex-col gap-2">
                      <MealCard m={m} offer={offerFor[m.id]} km={dist[m.restaurantId]} />
                      {(bmode === "group" || bmode === "family") && (
                        <div className="rounded-2xl border-2 border-ink bg-white px-3 py-2 text-sm">
                          <div className="flex justify-between"><span>{t.discover.perHead}</span><b>{price(p / SERVES[m.size])}</b></div>
                          {bmode === "group" && <div className="flex justify-between"><span>{t.discover.estimate} ×{servings}</span><b>{price(p * servings)}</b></div>}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full"><EmptyState title={t.common.noResults} /></div>
              )}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
