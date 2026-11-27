"use client";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CATEGORIES } from "@/data/categories";
import { MEALS } from "@/data/meals";
import { restaurantById } from "@/data/restaurants";
import { useI18n } from "@/lib/i18n";
import { useOffers } from "@/lib/hooks";
import { celebrate, sfx } from "@/lib/fx";
import type { CategoryId, Meal } from "@/lib/types";
import { Container, EmptyState, FavButton, FoodImage, PageHero, RatingBadge } from "@/components/ui";
import { LiveSoon } from "@/components/LiveSoon";
import { HAS_MEALS } from "@/data/live";

const BUDGETS = [1, 2, 3, 5, 10];

export function MysteryView() {
  const { t, l, price } = useI18n();
  const { active } = useOffers();
  const [budget, setBudget] = useState(3);
  const [cat, setCat] = useState<CategoryId | "">("");
  const [stage, setStage] = useState<"setup" | "wrapped" | "open" | "empty">("setup");
  const [meal, setMeal] = useState<Meal | null>(null);
  const [shake, setShake] = useState(0);

  const offerFor = (id: string) => active.find((o) => o.mealId === id);
  const finalPrice = (m: Meal) => offerFor(m.id)?.finalPrice ?? m.price;

  const wrap = () => {
    const pool = MEALS.filter((m) => finalPrice(m) <= budget && (!cat || m.category === cat));
    if (!pool.length) return setStage("empty");
    setMeal(pool[Math.floor(Math.random() * pool.length)]);
    setShake(0);
    setStage("wrapped");
    sfx.whoosh();
  };

  const tapBox = () => {
    if (shake < 2) {
      setShake((s) => s + 1);
      sfx.tick();
      return;
    }
    setStage("open");
    sfx.win();
    celebrate("big");
  };

  if (!HAS_MEALS)
    return (
      <>
        <PageHero title={`🎁 ${t.games.mystery.title}`} subtitle={t.games.mystery.desc} color="#FFD23F" />
        <Container className="py-10">
          <LiveSoon />
        </Container>
      </>
    );

  return (
    <>
      <PageHero title={`🎁 ${t.games.mystery.title}`} subtitle={t.games.mystery.desc} color="#FFD23F" />
      <Container className="py-10">
        <AnimatePresence mode="wait">
          {stage === "setup" || stage === "empty" ? (
            <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="sticker mx-auto max-w-xl space-y-5 p-6">
              <div>
                <h2 className="mb-2 font-display text-2xl font-bold">💰 {t.games.mystery.budget}</h2>
                <div className="flex flex-wrap gap-2">
                  {BUDGETS.map((b) => (
                    <button key={b} type="button" className="chip !px-4 !py-2" aria-pressed={budget === b} onClick={() => setBudget(b)}>
                      ≤ {price(b)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="mb-2 font-display text-2xl font-bold">🍽️ {t.games.mystery.category}</h2>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" className="chip" aria-pressed={cat === ""} onClick={() => setCat("")}>🎲 {t.common.any}</button>
                  {CATEGORIES.map((c) => (
                    <button key={c.id} type="button" className="chip !px-2.5 !py-1 !text-xs" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
                      {c.emoji} {l(c.name)}
                    </button>
                  ))}
                </div>
              </div>
              {stage === "empty" && <EmptyState title={t.common.noResults} />}
              <button type="button" className="btn btn-lagoon w-full py-4 font-display text-xl" onClick={wrap}>
                🎀 {t.games.mystery.wrap}
              </button>
            </motion.div>
          ) : stage === "wrapped" ? (
            <motion.div key="box" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 1.6, opacity: 0 }} className="flex flex-col items-center gap-6">
              <p className="font-display text-2xl font-bold">{t.games.mystery.tapToOpen}</p>
              <motion.button
                type="button"
                onClick={tapBox}
                key={shake}
                animate={{ rotate: [0, -10, 10, -6, 6, 0], scale: [1, 1.05 + shake * 0.05, 1 + shake * 0.04] }}
                transition={{ duration: 0.5 }}
                className="relative"
                aria-label={t.games.mystery.tapToOpen}
              >
                <GiftBox level={shake} />
              </motion.button>
              <div className="flex gap-2">{[0, 1, 2].map((i) => <span key={i} className={`size-3 rounded-full border-2 border-ink ${i < shake ? "bg-brand" : "bg-white"}`} />)}</div>
            </motion.div>
          ) : meal ? (
            <motion.div key="open" initial={{ scale: 0.3, opacity: 0, rotateY: 180 }} animate={{ scale: 1, opacity: 1, rotateY: 0 }} transition={{ type: "spring", stiffness: 120, damping: 12 }} className="mx-auto max-w-md">
              <div className="sticker overflow-hidden">
                <div className="relative">
                  <FoodImage src={meal.image} emoji={meal.emoji} alt={l(meal.name)} size="full" className="aspect-square w-full border-b-2 border-ink" />
                  {offerFor(meal.id)?.percent && <span className="absolute end-3 top-3 rounded-full border-2 border-ink bg-chili px-3 py-1 font-display text-xl font-extrabold text-white" dir="ltr">-{offerFor(meal.id)!.percent}%</span>}
                </div>
                <div className="space-y-2 p-5">
                  <h2 className="font-display text-3xl font-extrabold">{l(meal.name)}</h2>
                  <p className="text-ink-soft">{l(meal.description)}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-3xl font-extrabold text-brand">{price(finalPrice(meal))}</span>
                    <RatingBadge rating={restaurantById(meal.restaurantId)!.rating} compact />
                  </div>
                  <p className="font-bold">{restaurantById(meal.restaurantId)!.emoji} {l(restaurantById(meal.restaurantId)!.name)}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Link href={`/restaurants/${meal.restaurantId}/`} className="btn btn-primary btn-sm">{t.common.viewRestaurant}</Link>
                    <FavButton kind="meals" id={meal.id} />
                    <button type="button" className="btn btn-lagoon btn-sm" onClick={wrap}>🎁 {t.games.mystery.another}</button>
                    <button type="button" className="btn btn-light btn-sm" onClick={() => setStage("setup")}>⚙️</button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Container>
    </>
  );
}

function GiftBox({ level }: { level: number }) {
  return (
    <svg width="220" height="220" viewBox="0 0 220 220" className="drop-shadow-[6px_6px_0_#2B1B3D]" aria-hidden>
      <rect x="30" y="95" width="160" height="110" rx="14" fill="#0E8C99" stroke="#2B1B3D" strokeWidth="5" />
      <rect x="97" y="95" width="26" height="110" fill="#FFD23F" stroke="#2B1B3D" strokeWidth="4" />
      <g style={{ transform: `translateY(${-level * 6}px) rotate(${level * -3}deg)`, transformOrigin: "110px 90px", transition: "transform .3s" }}>
        <rect x="20" y="70" width="180" height="36" rx="10" fill="#9B83FF" stroke="#2B1B3D" strokeWidth="5" />
        <rect x="97" y="70" width="26" height="36" fill="#FFD23F" stroke="#2B1B3D" strokeWidth="4" />
        <path d="M110 70 C80 20 40 40 70 66 Z" fill="#F2542D" stroke="#2B1B3D" strokeWidth="4" />
        <path d="M110 70 C140 20 180 40 150 66 Z" fill="#F2542D" stroke="#2B1B3D" strokeWidth="4" />
        <circle cx="110" cy="68" r="10" fill="#FFD23F" stroke="#2B1B3D" strokeWidth="4" />
      </g>
      <text x="60" y="165" fontSize="30">❓</text>
      <text x="140" y="165" fontSize="30">❓</text>
    </svg>
  );
}
