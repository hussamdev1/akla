"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useNow } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { celebrate, sfx } from "@/lib/fx";
import { localDateKey, localDayStart, seeded } from "@/lib/time";
import type { L } from "@/lib/types";
import { Container, Countdown, cx, PageHero, SectionHeader } from "@/components/ui";

const NONE: string[] = [];

/** `{n}` in a text is a KWD budget preset, shown in the selected currency. */
type Challenge = { id: string; e: string; text: L; href: string; xp: number; color: string };

export const CHALLENGES: Challenge[] = [
  { id: "new-rest", e: "🧭", text: { en: "Try a restaurant you have never visited", ar: "جرّب مطعم عمرك ما رحته" }, href: "/restaurants/", xp: 30, color: "#FFE3C9" },
  { id: "new-cuisine", e: "🌍", text: { en: "Discover a cuisine you rarely eat", ar: "اكتشف مطبخ نادراً تاكل منه" }, href: "/discover/", xp: 25, color: "#DDF1FF" },
  { id: "under-2", e: "🪙", text: { en: "Find a meal under {2}", ar: "لقّ وجبة بأقل من {2}" }, href: "/discover/#budget", xp: 15, color: "#D9FBEF" },
  { id: "top-burger", e: "🍔", text: { en: "Try the highest-rated burger nearby", ar: "جرّب أعلى برجر تقييماً قريب منك" }, href: "/discover/?c=burgers", xp: 25, color: "#FFF0D6" },
  { id: "big-discount", e: "💥", text: { en: "Find a restaurant with a discount of 30% or more", ar: "لقّ مطعم عليه خصم ٣٠٪ أو أكثر" }, href: "/offers/", xp: 20, color: "#FFD9DC" },
  { id: "cheap-burger-5", e: "📍", text: { en: "Find the cheapest burger within 5 km", ar: "لقّ أرخص برجر ضمن ٥ كم" }, href: "/nearby/", xp: 20, color: "#FFE3C9" },
  { id: "biggest-discount", e: "🏷️", text: { en: "Find the meal with the biggest discount today", ar: "لقّ الوجبة اللي عليها أكبر خصم اليوم" }, href: "/offers/", xp: 15, color: "#FFD9DC" },
  { id: "outside-usual", e: "🎢", text: { en: "Order something outside your usual cuisine", ar: "اطلب شي برّا مطبخك المعتاد" }, href: "/picker/?mode=category", xp: 30, color: "#F3E8FF" },
  { id: "spin-surprise", e: "🎡", text: { en: "Spin the wheel in “Surprise me” mode and go with it", ar: "لِف العجلة بوضع «فاجئني» والتزم بالنتيجة" }, href: "/picker/?mode=anything", xp: 20, color: "#FFF7CC" },
  { id: "battle", e: "⚔️", text: { en: "Crown a Food Battle champion", ar: "توّج بطل في معركة الأكل" }, href: "/games/battle/", xp: 15, color: "#FFE1E1" },
  { id: "healthy-lunch", e: "🥗", text: { en: "Pick a healthy lunch under {3}", ar: "اختار غدا صحي بأقل من {3}" }, href: "/discover/?c=healthy", xp: 20, color: "#E6F9D5" },
  { id: "collection", e: "📚", text: { en: "Create a collection and save 3 favourites", ar: "سوّ مجموعة واحفظ فيها ٣ مفضلات" }, href: "/favorites/", xp: 15, color: "#E0F2FE" },
  { id: "breakfast-out", e: "🍳", text: { en: "Have breakfast out before 9am", ar: "افطر برّا البيت قبل ٩ الصبح" }, href: "/discover/?c=breakfast", xp: 25, color: "#FFF7CC" },
  { id: "spicy", e: "🌶️", text: { en: "Survive a level-3 spicy dish", ar: "تحدّى طبق حار من المستوى ٣" }, href: "/discover/", xp: 30, color: "#FFD9DC" },
  { id: "group", e: "👯", text: { en: "Settle a group dinner with Group Decision", ar: "احسم عشا الشلة بلعبة قرار الشلة" }, href: "/games/group/", xp: 25, color: "#DDF1FF" },
  { id: "dessert-first", e: "🍰", text: { en: "Dessert first. Just once.", ar: "الحلا أول.. بس هالمرة." }, href: "/discover/?c=desserts", xp: 10, color: "#F3E8FF" },
];

function pick(key: string, n: number) {
  const rnd = seeded(key);
  const pool = [...CHALLENGES];
  const out: Challenge[] = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  return out;
}

export function ChallengesView() {
  const { t, l: lRaw, price, amt } = useI18n();
  const l = (x: L) => lRaw(x).replace(/\{(\d+(?:\.\d+)?)\}/g, (_, n: string) => price(amt(Number(n))));
  const now = useNow(60_000);
  const key = now ? localDateKey(now) : "";
  const doneRaw = useStore((s) => s.challengesDone[key]);
  const done = doneRaw ?? NONE;
  const toggle = useStore((s) => s.toggleChallenge);
  const allDone = useStore((s) => s.challengesDone);
  const [random, setRandom] = useState<Challenge | null>(null);

  const daily = useMemo(() => (key ? pick(key, 3) : []), [key]);
  const nextReset = now ? new Date(localDayStart(now) + 864e5).toISOString() : null;
  const totalXp = Object.values(allDone).flat().reduce((s, id) => s + (CHALLENGES.find((c) => c.id === id)?.xp ?? 0), 0);

  const roll = () => {
    sfx.whoosh();
    let c: Challenge;
    do c = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
    while (c.id === random?.id);
    setRandom(c);
  };

  return (
    <>
      <PageHero title={`🎯 ${t.games.challenges.title}`} subtitle={t.games.challenges.desc} color="#9BE15D">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border-2 border-ink bg-white px-3 py-1 font-bold">⚡ {totalXp} XP</span>
          {nextReset && (
            <span className="rounded-full border-2 border-ink bg-white px-3 py-1">
              <Countdown to={nextReset} compact label={t.games.challenges.resetsIn} />
            </span>
          )}
        </div>
      </PageHero>
      <Container className="py-10">
        <div className="grid gap-5 md:grid-cols-3">
          {daily.map((c, i) => {
            const isDone = done.includes(c.id);
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={cx("sticker relative flex flex-col gap-3 overflow-hidden p-5", isDone && "opacity-90")} style={{ background: c.color }}>
                <span className="text-5xl">{c.e}</span>
                <p className={cx("font-display text-2xl font-bold leading-snug", isDone && "line-through decoration-4")}>{l(c.text)}</p>
                <span className="w-fit rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-white">+{c.xp} XP</span>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Link href={c.href} className="btn btn-light btn-sm">{t.home.play} <span className="rtl:rotate-180">→</span></Link>
                  <button
                    type="button"
                    className={cx("btn btn-sm", isDone ? "btn-lime" : "btn-primary")}
                    onClick={() => {
                      toggle(key, c.id);
                      if (!isDone) {
                        sfx.win();
                        celebrate("small");
                      }
                    }}
                  >
                    <Check className="size-4" /> {isDone ? t.games.challenges.done : t.games.challenges.markDone}
                  </button>
                </div>
                <AnimatePresence>
                  {isDone && (
                    <motion.span initial={{ scale: 3, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 1, rotate: -12 }} exit={{ opacity: 0 }} className="absolute end-4 top-4 rounded-xl border-4 border-emerald-700 px-2 font-display text-xl font-extrabold text-emerald-700">
                      ✓ {t.games.challenges.done}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <section id="random" className="mt-14 scroll-mt-28">
          <SectionHeader title={t.games.challenges.random} emoji="🎲" />
          <div className="sticker flex flex-col items-center gap-5 bg-lagoon/10 p-8 text-center">
            <AnimatePresence mode="wait">
              {random ? (
                <motion.div key={random.id} initial={{ rotateX: 90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} exit={{ rotateX: -90, opacity: 0 }} className="space-y-2">
                  <div className="text-6xl">{random.e}</div>
                  <p className="font-display text-3xl font-bold">{l(random.text)}</p>
                  <Link href={random.href} className="btn btn-primary btn-sm">{t.home.play}</Link>
                </motion.div>
              ) : (
                <motion.div key="q" className="text-7xl" animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                  🎲
                </motion.div>
              )}
            </AnimatePresence>
            <button type="button" className="btn btn-lagoon" onClick={roll}>🎲 {t.games.challenges.generate}</button>
          </div>
        </section>
      </Container>
    </>
  );
}
