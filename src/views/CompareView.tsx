"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Trophy, X } from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { MEALS } from "@/data/meals";
import { restaurantById } from "@/data/restaurants";
import { useI18n } from "@/lib/i18n";
import { useDistances, useOffers } from "@/lib/hooks";
import type { CategoryId, MealSize } from "@/lib/types";
import { Container, cx, FoodImage, PageHero, RatingBadge } from "@/components/ui";

const SERVES: Record<MealSize, number> = { snack: 0.5, regular: 1, large: 1.5, family: 4 };

export function CompareView() {
  const { t, l, price, km } = useI18n();
  const dist = useDistances();
  const { active } = useOffers();
  const [cat, setCat] = useState<CategoryId>("burgers");
  const [ids, setIds] = useState<string[]>(() => {
    const demo = ["bv-smash", "bv-kofta", "ss-beef"].filter((id) => MEALS.some((m) => m.id === id));
    return demo.length ? demo : MEALS.filter((m) => m.category === "burgers").slice(0, 3).map((m) => m.id);
  });

  const pool = MEALS.filter((m) => m.category === cat);
  const chosen = ids.map((id) => MEALS.find((m) => m.id === id)!).filter(Boolean);
  const offerFor = (id: string) => active.find((o) => o.mealId === id);

  const rows = useMemo(
    () =>
      chosen.map((m) => {
        const r = restaurantById(m.restaurantId)!;
        const o = offerFor(m.id);
        const final = o?.finalPrice ?? m.price;
        const perServing = final / SERVES[m.size];
        const value = (SERVES[m.size] * ((r.rating ?? 4) / 4)) / final;
        return { m, r, o, final, perServing, value };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids, active],
  );
  const best = rows.length > 1 ? rows.reduce((a, b) => (b.value > a.value ? b : a)) : null;
  const mixedSizes = new Set(rows.map((r) => r.m.size)).size > 1 || new Set(rows.map((r) => r.m.category)).size > 1;

  const add = (id: string) => setIds((s) => (s.includes(id) || s.length >= 3 ? s : [...s, id]));

  const line = (label: string, render: (r: (typeof rows)[number]) => React.ReactNode) => (
    <tr className="border-t-2 border-dashed border-ink/15">
      <th className="whitespace-nowrap p-3 text-start text-sm font-bold text-ink-soft">{label}</th>
      {rows.map((r) => <td key={r.m.id} className={cx("p-3 text-center font-semibold", best?.m.id === r.m.id && "bg-lime/15")}>{render(r)}</td>)}
    </tr>
  );

  return (
    <>
      <PageHero title={t.compare.title} subtitle={t.compare.subtitle} emoji="⚖️" color="#E9B5FF" />
      <Container className="py-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="font-bold">{t.compare.pick}:</span>
          {CATEGORIES.filter((c) => MEALS.filter((m) => m.category === c.id).length >= 2).map((c) => (
            <button key={c.id} type="button" className="chip !text-xs" aria-pressed={cat === c.id} onClick={() => { setCat(c.id); setIds(MEALS.filter((m) => m.category === c.id).slice(0, 3).map((m) => m.id)); }}>
              {c.emoji} {l(c.name)}
            </button>
          ))}
        </div>
        <div className="mb-6 flex flex-wrap gap-2">
          {pool.filter((m) => !ids.includes(m.id)).map((m) => (
            <button key={m.id} type="button" disabled={ids.length >= 3} onClick={() => add(m.id)} className="chip disabled:opacity-40">
              <Plus className="size-3.5" /> {m.emoji} {l(m.name)}
            </button>
          ))}
          <span className="self-center text-xs font-semibold text-ink-soft">{t.compare.max}</span>
        </div>

        {mixedSizes && rows.length > 1 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 rounded-2xl border-2 border-ink bg-sun/40 p-3 text-sm font-bold">
            ⚠️ {t.compare.notEquivalent}
          </motion.p>
        )}

        <div className="sticker overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse">
            <thead>
              <tr>
                <th className="w-28 sm:w-40" />
                <AnimatePresence>
                  {rows.map((r) => (
                    <motion.th key={r.m.id} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cx("relative p-3 align-top", best?.m.id === r.m.id && "bg-lime/15")}>
                      <button type="button" onClick={() => setIds(ids.filter((x) => x !== r.m.id))} className="absolute end-2 top-2 z-10 grid size-7 place-items-center rounded-full border-2 border-ink bg-white" aria-label="remove"><X className="size-3.5" /></button>
                      {best?.m.id === r.m.id && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1, rotate: -8 }} className="absolute start-2 top-2 z-10 inline-flex items-center gap-1 rounded-full border-2 border-ink bg-lime px-2 py-0.5 text-xs font-extrabold">
                          <Trophy className="size-3.5" /> {t.compare.bestValue}
                        </motion.span>
                      )}
                      <FoodImage src={r.m.image} emoji={r.m.emoji} alt="" className="mx-auto aspect-square w-full max-w-44 rounded-2xl border-2 border-ink" />
                      <div className="mt-2 font-display text-lg font-bold">{l(r.m.name)}</div>
                    </motion.th>
                  ))}
                </AnimatePresence>
              </tr>
            </thead>
            <tbody>
              {line(t.compare.restaurant, (r) => <Link href={`/restaurants/${r.r.id}/`} className="text-brand hover:underline">{r.r.emoji} {l(r.r.name)}</Link>)}
              {line(t.compare.price, (r) => price(r.m.price))}
              {line(t.compare.discount, (r) => (r.o?.percent ? <span className="text-chili">-{r.o.percent}%</span> : "—"))}
              {line(t.compare.final, (r) => <span className="font-display text-xl font-extrabold">{price(r.final)}</span>)}
              {line(t.compare.size, (r) => `${t.sizes[r.m.size]}`)}
              {line(t.discover.perHead, (r) => price(r.perServing))}
              {line(t.compare.rating, (r) => <RatingBadge rating={r.r.rating} compact />)}
              {line(t.compare.distance, (r) => km(dist[r.r.id]))}
              {line(t.compare.delivery, () => <span className="text-ink-soft">{t.compare.unknownFee}</span>)}
              {line(t.compare.total, (r) => <span>{price(r.final)} <span className="text-xs text-ink-soft">+ {t.compare.delivery}</span></span>)}
            </tbody>
          </table>
          {!rows.length && <p className="p-8 text-center font-semibold text-ink-soft">{t.compare.add}</p>}
        </div>
        <p className="mt-3 text-xs font-semibold text-ink-soft">ℹ️ {t.common.mealPriceOnly} · {t.common.demoData}</p>
      </Container>
    </>
  );
}
