"use client";
import Link from "next/link";
import { useLive, useMeals } from "@/lib/hooks";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { restaurantById } from "@/data/restaurants";
import { categoryById } from "@/data/categories";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { celebrate, sfx } from "@/lib/fx";
import type { Meal } from "@/lib/types";
import { Container, FavButton, FoodImage, PageHero } from "@/components/ui";
import { LiveSoon } from "@/components/LiveSoon";

function drawEight(MEALS: Meal[]): Meal[] {
  const byCat = new Map<string, Meal[]>();
  for (const m of [...MEALS].sort(() => Math.random() - 0.5)) {
    if (!byCat.has(m.category)) byCat.set(m.category, []);
    byCat.get(m.category)!.push(m);
  }
  let picks = [...byCat.values()].sort(() => Math.random() - 0.5).slice(0, 8).map((list) => list[0]);
  // brackets need 8, 4 or 2 dishes — top up from other meals, then trim to a power of two
  if (picks.length < 8) picks = [...picks, ...MEALS.filter((m) => !picks.includes(m)).sort(() => Math.random() - 0.5)].slice(0, 8);
  const size = picks.length >= 8 ? 8 : picks.length >= 4 ? 4 : picks.length >= 2 ? 2 : 0;
  return picks.slice(0, size);
}

export function BattleView() {
  const MEALS = useMeals();
  const { hasMeals: HAS_MEALS } = useLive();
  const { t, l, price } = useI18n();
  const winBattle = useStore((s) => s.winBattle);
  const [round, setRound] = useState<Meal[]>([]);
  const [next, setNext] = useState<Meal[]>([]);
  const [match, setMatch] = useState(0);
  const [stage, setStage] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [champion, setChampion] = useState<Meal | null>(null);
  const [history, setHistory] = useState<Meal[][]>([]);

  const start = useCallback(() => {
    const eight = drawEight(MEALS);
    setRound(eight);
    setHistory([eight]);
    setNext([]);
    setMatch(0);
    setStage(0);
    setChampion(null);
    setPicked(null);
  }, [MEALS]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value read after hydration (static export)
  useEffect(start, [start]);

  const a = round[match * 2];
  const b = round[match * 2 + 1];

  const choose = (w: Meal) => {
    if (picked) return;
    setPicked(w.id);
    sfx.pop();
    setTimeout(() => {
      const nn = [...next, w];
      if (match * 2 + 2 >= round.length) {
        if (nn.length === 1) {
          setChampion(w);
          winBattle();
          sfx.win();
          celebrate("big");
        } else {
          setRound(nn);
          setHistory((h) => [...h, nn]);
          setNext([]);
          setMatch(0);
          setStage((s) => s + 1);
        }
      } else {
        setNext(nn);
        setMatch((m) => m + 1);
      }
      setPicked(null);
    }, 650);
  };

  const totalMatches = round.length / 2;
  // a 4-dish bracket starts at the semi-final, a 2-dish one at the final
  const offset = 3 - Math.log2(history[0]?.length || 8);

  const side = (m: Meal, dir: number) => {
    const r = restaurantById(m.restaurantId)!;
    const win = picked === m.id;
    const lose = picked && picked !== m.id;
    return (
      <motion.button
        key={m.id}
        type="button"
        onClick={() => choose(m)}
        initial={{ x: dir * 120, opacity: 0, rotate: dir * 8 }}
        animate={{ x: 0, opacity: lose ? 0.25 : 1, rotate: 0, scale: win ? 1.06 : lose ? 0.9 : 1, filter: lose ? "grayscale(1)" : "grayscale(0)" }}
        exit={{ opacity: 0, scale: 0.8 }}
        whileHover={!picked ? { y: -8 } : {}}
        whileTap={{ scale: 0.96 }}
        className="sticker group relative flex flex-col overflow-hidden text-start"
      >
        <FoodImage src={m.image} emoji={m.emoji} alt={l(m.name)} color={categoryById(m.category).color} className="aspect-square w-full border-b-2 border-ink" />
        <div className="space-y-1 p-4">
          <span className="text-sm font-bold" style={{ color: categoryById(m.category).ink }}>{categoryById(m.category).emoji} {l(categoryById(m.category).name)}</span>
          <h3 className="font-display text-2xl font-bold leading-tight">{l(m.name)}</h3>
          <p className="text-sm text-ink-soft">{l(r.name)} · {price(m.price)}</p>
        </div>
        {win && (
          <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: -12 }} className="absolute end-3 top-3 rounded-full border-2 border-ink bg-lime px-4 py-2 font-display text-2xl font-extrabold shadow-[3px_3px_0_#2B1B3D]">
            ✓
          </motion.span>
        )}
      </motion.button>
    );
  };

  if (!HAS_MEALS)
    return (
      <>
        <PageHero title={`⚔️ ${t.games.battle.title}`} subtitle={t.games.battle.desc} color="#F2542D" />
        <Container className="py-10">
          <LiveSoon />
        </Container>
      </>
    );

  return (
    <>
      <PageHero title={`⚔️ ${t.games.battle.title}`} subtitle={t.games.battle.desc} color="#F2542D" />
      <Container className="py-8">
        {/* Bracket progress */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          {t.games.battle.rounds.map((r, i) => (
            <span key={r} className={`rounded-full border-2 border-ink px-3 py-1 text-sm font-bold ${i === stage + offset && !champion ? "bg-ink text-white" : i < stage + offset || champion ? "bg-lime" : "bg-white"}`}>
              {r}
            </span>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {champion ? (
            <motion.div key="champ" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto max-w-md text-center">
              <motion.div animate={{ rotate: [0, -8, 8, 0], y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-7xl">🏆</motion.div>
              <h2 className="my-3 font-display text-4xl font-extrabold">{t.games.battle.champion}</h2>
              <div className="sticker overflow-hidden">
                <FoodImage src={champion.image} emoji={champion.emoji} alt={l(champion.name)} className="aspect-square w-full border-b-2 border-ink" />
                <div className="p-4">
                  <h3 className="font-display text-3xl font-bold">{l(champion.name)}</h3>
                  <p className="text-ink-soft">{l(restaurantById(champion.restaurantId)!.name)} · {price(champion.price)}</p>
                  <div className="mt-3 flex justify-center gap-2">
                    <Link href={`/restaurants/${champion.restaurantId}/`} className="btn btn-primary btn-sm">{t.common.viewRestaurant}</Link>
                    <FavButton kind="meals" id={champion.id} />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {history.flat().filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i).map((m) => (
                  <span key={m.id} className={`rounded-full border-2 border-ink px-2 py-0.5 text-sm ${m.id === champion.id ? "bg-sun font-bold" : "bg-white opacity-60"}`}>{m.emoji} {l(m.name)}</span>
                ))}
              </div>
              <button type="button" className="btn btn-chili mt-6" onClick={start}>⚔️ {t.games.battle.again}</button>
            </motion.div>
          ) : a && b ? (
            <motion.div key={`${stage}-${match}`} className="mx-auto max-w-4xl">
              <p className="mb-4 text-center font-bold text-ink-soft">
                {t.games.battle.rounds[stage + offset]} · {match + 1}/{totalMatches} — {t.games.battle.tap}
              </p>
              <div className="relative grid grid-cols-2 items-center gap-3 sm:gap-8">
                {side(a, -1)}
                {side(b, 1)}
                <div className="pointer-events-none absolute left-1/2 top-[38%] z-10 -translate-x-1/2 -translate-y-1/2">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, 10, -10, 0] }} className="grid size-14 place-items-center rounded-full border-4 border-ink bg-sun font-display text-lg font-extrabold shadow-[4px_4px_0_#2B1B3D] sm:size-20 sm:text-2xl">
                    {t.games.battle.vs}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Container>
    </>
  );
}
