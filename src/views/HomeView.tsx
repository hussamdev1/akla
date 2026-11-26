"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Dices, Search, Sparkles } from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { MEALS, mealById } from "@/data/meals";
import { RESTAURANTS, restaurantById } from "@/data/restaurants";
import { useI18n } from "@/lib/i18n";
import { useDistances, useNow, useOffers } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { mealTimeAt } from "@/lib/time";
import { recommend } from "@/lib/recommend";
import type { Meal, Mood } from "@/lib/types";
import { CategoryCard, MealCard, OfferCard, RestaurantCard } from "@/components/cards";
import { Container, Countdown, DemoBadge, FoodImage, Reveal, SectionHeader, Tilt } from "@/components/ui";
import { Lugma } from "@/components/Logo";
import { LocationPill, useLocationLabel } from "@/components/shell/LocationPicker";
import { MiniWheel } from "@/components/Wheel";

const FLOATERS = [
  { e: "🍔", x: "6%", y: "18%", s: 3.2, d: 0, r: -12 },
  { e: "🍕", x: "88%", y: "14%", s: 3, d: 1.2, r: 14 },
  { e: "🌮", x: "78%", y: "72%", s: 2.6, d: 0.6, r: -8 },
  { e: "🍣", x: "14%", y: "78%", s: 2.4, d: 1.8, r: 10 },
  { e: "🍩", x: "48%", y: "6%", s: 2, d: 2.4, r: 0 },
  { e: "🌯", x: "94%", y: "46%", s: 2.2, d: 0.9, r: 18 },
  { e: "🧋", x: "2%", y: "50%", s: 2.2, d: 1.5, r: -16 },
  { e: "🍦", x: "60%", y: "88%", s: 2, d: 2.1, r: 6 },
];

const MOODS: { id: Mood; e: string; c: string }[] = [
  { id: "starving", e: "🤤", c: "#E63462" },
  { id: "delicious", e: "😋", c: "#FFD23F" },
  { id: "cheap", e: "🪙", c: "#9BE15D" },
  { id: "healthy", e: "🥗", c: "#9AE6B4" },
  { id: "spicy", e: "🌶️", c: "#F2542D" },
  { id: "comfort", e: "🛋️", c: "#FF8FAB" },
  { id: "sweet", e: "🍰", c: "#E9B5FF" },
  { id: "surprise", e: "🎁", c: "#0E8C99" },
  { id: "new", e: "🧭", c: "#7DD3FC" },
];

export function HomeView() {
  const { t, l, locale } = useI18n();
  const { active } = useOffers();
  const now = useNow(60_000);
  const dist = useDistances();
  const locLabel = useLocationLabel();
  const time = now ? mealTimeAt(now) : undefined;

  const offerFor = useMemo(() => {
    const map: Record<string, (typeof active)[number]> = {};
    for (const o of active) if (o.mealId) map[o.mealId] = o;
    return map;
  }, [active]);

  const nearest = useMemo(() => [...RESTAURANTS].sort((a, b) => dist[a.id] - dist[b.id]).slice(0, 8), [dist]);
  const bestOffers = useMemo(() => [...active].sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0)).slice(0, 6), [active]);

  return (
    <div className="overflow-x-clip">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-rice">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -start-24 -top-24 size-[28rem] animate-blob rounded-full bg-brand/45 blur-3xl" />
          <div className="absolute -end-20 top-10 size-[24rem] animate-blob rounded-full bg-chili/35 blur-3xl [animation-delay:-6s]" />
          <div className="absolute bottom-[-8rem] start-1/3 size-[26rem] animate-blob rounded-full bg-sun/50 blur-3xl [animation-delay:-12s]" />
          <div className="absolute bottom-0 end-1/4 size-64 animate-blob rounded-full bg-lagoon/25 blur-3xl [animation-delay:-3s]" />
          <div className="dots-bg absolute inset-0 opacity-40" />
          {FLOATERS.map((f, i) => (
            <span key={i} className="absolute hidden animate-float select-none drop-shadow-[3px_4px_0_rgba(43,27,61,0.18)] sm:block" style={{ left: f.x, top: f.y, fontSize: `${f.s}rem`, animationDelay: `${f.d}s`, ["--r" as string]: `${f.r}deg` }}>
              {f.e}
            </span>
          ))}
        </div>

        <Container className="relative grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:py-20">
          <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-1 text-sm font-bold shadow-[2px_2px_0_#2B1B3D]">
              <Sparkles className="size-4 text-brand" />
              <span suppressHydrationWarning>{time ? t.greeting[time] : t.hero.kicker}</span>
            </motion.div>
            <h1 className="font-display text-5xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
              {t.hero.title.split(" ").map((w, i, arr) => (
                <motion.span
                  key={`${locale}-${i}`}
                  initial={{ opacity: 0, y: 30, rotate: -6 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ delay: 0.08 * i, type: "spring", stiffness: 300, damping: 18 }}
                  className={`me-3 inline-block ${i === arr.length - 1 ? "text-brand" : ""}`}
                >
                  {w}
                </motion.span>
              ))}
            </h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mt-4 max-w-xl text-lg font-medium text-ink/80 sm:text-xl">
              {t.hero.subtitle}
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="sticker mt-6 flex items-center gap-2 p-2"
              onSubmit={(e) => {
                e.preventDefault();
                const q = new FormData(e.currentTarget).get("q")?.toString() ?? "";
                window.dispatchEvent(new CustomEvent("akla:search", { detail: q }));
              }}
            >
              <LocationPill dark className="shrink-0" />
              <label className="relative flex-1">
                <span className="sr-only">{t.nav.search}</span>
                <Search className="absolute start-2 top-1/2 size-5 -translate-y-1/2 text-ink-soft" />
                <input name="q" placeholder={t.header.searchPlaceholder} className="w-full bg-transparent py-2 ps-9 pe-2 font-medium outline-none" />
              </label>
              <button className="btn btn-sun btn-sm hidden sm:inline-flex">{t.hero.searchCta}</button>
            </motion.form>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mt-5 flex flex-wrap gap-3">
              <a href="#mood" className="btn btn-primary text-lg">
                <Sparkles className="size-5" /> {t.hero.find}
              </a>
              <Link href="/picker/" className="btn btn-lagoon text-lg">
                <Dices className="size-5" /> {t.hero.spin}
              </Link>
            </motion.div>

            <div className="mt-6 flex flex-wrap gap-2 text-sm font-bold">
              {[
                [RESTAURANTS.length, t.hero.stats.places, "#FFE3C9"],
                [MEALS.length, t.hero.stats.meals, "#D9FBEF"],
                [active.length, t.hero.stats.deals, "#FFD9DC"],
              ].map(([n, label, bg]) => (
                <span key={label as string} className="rounded-full border-2 border-ink px-3 py-1" style={{ background: bg as string }}>
                  <span className="font-display text-base">{n as number}</span> {label as string}
                </span>
              ))}
              <DemoBadge className="self-center" />
            </div>
          </div>

          {/* Collage */}
          <div className="relative mx-auto h-[22rem] w-full max-w-md sm:h-[26rem]">
            <HeroPhoto m={mealById("bv-smash")!} className="start-0 top-2 w-[58%] -rotate-6" delay={0.2} />
            <HeroPhoto m={mealById("sr-platter")!} className="end-0 top-10 w-[52%] rotate-6" delay={0.35} />
            <HeroPhoto m={mealById("sd-kunafa")!} className="bottom-0 start-[18%] w-[54%] rotate-3" delay={0.5} />
            <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.7, type: "spring" }} className="absolute bottom-6 end-0 z-20">
              <Link href="/picker/" aria-label={t.hero.spin} className="block">
                <MiniWheel size={124} />
              </Link>
            </motion.div>
            <motion.div className="absolute -top-4 end-[40%] z-20" animate={{ y: [0, -10, 0], rotate: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
              <Lugma size={70} />
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ================= MARQUEE ================= */}
      <div className="overflow-hidden border-b-2 border-ink bg-ink py-3 text-white" dir="ltr">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap font-display text-xl">
          {[...CATEGORIES, ...CATEGORIES].map((c, i) => (
            <span key={i} className="inline-flex items-center gap-2">
              <span>{c.emoji}</span>
              <span className={i % 3 === 0 ? "text-sun" : i % 3 === 1 ? "text-brand" : "text-lime"}>{l(c.name)}</span>
              <span className="text-white/30">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ================= HIGHLIGHTS ================= */}
      <Container className="py-12">
        <Reveal>
          <SectionHeader title={t.home.highlights} subtitle={t.home.highlightsSub} emoji="✨" />
        </Reveal>
        <Highlights time={time} />
      </Container>

      {/* ================= CATEGORIES ================= */}
      <section className="border-y-2 border-ink bg-white py-12">
        <Container>
          <Reveal>
            <SectionHeader title={t.home.categories} subtitle={t.home.categoriesSub} href="/discover/" emoji="🍽️" />
          </Reveal>
          <div className="scroll-row">
            {CATEGORIES.map((c, i) => (
              <Reveal key={c.id} delay={Math.min(i, 8) * 0.04}>
                <CategoryCard c={c} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ================= MOOD ================= */}
      <MoodSection />

      {/* ================= NEAR YOU ================= */}
      <Container className="py-12">
        <Reveal>
          <SectionHeader title={t.home.near} subtitle={t.home.nearSub(locLabel)} href="/nearby/" emoji="📍" />
        </Reveal>
        <div className="scroll-row">
          {nearest.map((r) => (
            <div key={r.id} className="w-72">
              <RestaurantCard r={r} km={dist[r.id]} offers={active.filter((o) => o.restaurantId === r.id).length} featuredMeal={MEALS.find((m) => m.restaurantId === r.id && m.editorsPick)} />
            </div>
          ))}
        </div>
      </Container>

      {/* ================= OFFERS ================= */}
      <section className="relative overflow-hidden border-y-2 border-ink bg-chili py-12">
        <div className="dots-bg absolute inset-0 opacity-30" />
        <Container className="relative">
          <Reveal>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 text-white">
              <div>
                <h2 className="font-display text-4xl font-extrabold sm:text-5xl">🔥 {t.home.offers}</h2>
                <p className="mt-1 text-white/90">{t.home.offersSub}</p>
              </div>
              <Link href="/offers/" className="btn btn-light btn-sm">
                {t.common.seeAll} <span className="rtl:rotate-180">→</span>
              </Link>
            </div>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {bestOffers.map((o, i) => (
              <Reveal key={o.id} delay={i * 0.05}>
                <OfferCard o={o} km={dist[o.restaurantId]} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ================= GAMES ================= */}
      <GamesTeaser />

      {/* ================= FOR NOW ================= */}
      <Container className="py-12">
        <Reveal>
          <SectionHeader title={time ? t.discover.forNow(t.mealTimes[time]) : t.home.hl.reco} href="/discover/" emoji="⏰" />
        </Reveal>
        <ForNow offerFor={offerFor} />
      </Container>
    </div>
  );
}

function HeroPhoto({ m, className, delay }: { m: Meal; className: string; delay: number }) {
  const { l, price } = useI18n();
  const r = restaurantById(m.restaurantId)!;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.6, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay, type: "spring", stiffness: 160 }} className={`absolute z-10 ${className}`}>
      <Tilt>
        <Link href={`/restaurants/${r.id}/`} className="sticker block overflow-hidden p-1.5">
          <FoodImage src={m.image} emoji={m.emoji} alt={l(m.name)} className="aspect-square w-full rounded-[1.1rem]" />
          <div className="flex items-center justify-between gap-2 px-1.5 py-1 text-xs font-bold">
            <span className="truncate">{l(m.name)}</span>
            <span className="shrink-0 text-brand">{price(m.price)}</span>
          </div>
        </Link>
      </Tilt>
    </motion.div>
  );
}

function Highlights({ time }: { time?: ReturnType<typeof mealTimeAt> }) {
  const { t, l, price } = useI18n();
  const { active } = useOffers();
  const items = useMemo(() => {
    const deal = [...active].sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0))[0];
    const ending = [...active].sort((a, b) => +new Date(a.expiresAt) - +new Date(b.expiresAt))[0];
    const pick = MEALS.find((m) => m.id === "dk-kabsa")!;
    const top = [...RESTAURANTS].filter((r) => r.rating).sort((a, b) => b.rating! - a.rating!)[0];
    const fresh = RESTAURANTS.find((r) => r.isNew)!;
    const reco = recommend({ time, random: () => 0.5 }, 4).find((m) => m.id !== pick.id && m.id !== deal?.mealId);
    const promo = active.find((o) => o.tags.includes("exclusive"));
    type H = { key: string; label: string; color: string; title: string; sub: string; img?: string; emoji: string; href: string; countdown?: string };
    const list: H[] = [];
    if (deal) {
      const m = deal.mealId ? mealById(deal.mealId) : undefined;
      const r = restaurantById(deal.restaurantId)!;
      list.push({ key: "deal", label: t.home.hl.deal, color: "#F2542D", title: l(deal.title), sub: `${l(r.name)} · ${deal.finalPrice !== undefined ? price(deal.finalPrice) : ""}`, img: m?.image ?? r.cover, emoji: r.emoji, href: `/restaurants/${r.id}/#offers`, countdown: deal.expiresAt });
    }
    list.push({ key: "pick", label: t.home.hl.popular, color: "#FFD23F", title: l(pick.name), sub: `${l(restaurantById(pick.restaurantId)!.name)} · ${price(pick.price)}`, img: pick.image, emoji: pick.emoji, href: `/restaurants/${pick.restaurantId}/` });
    if (reco) list.push({ key: "reco", label: t.home.hl.reco, color: "#0E8C99", title: l(reco.name), sub: `${l(restaurantById(reco.restaurantId)!.name)} · ${price(reco.price)}`, img: reco.image, emoji: reco.emoji, href: `/restaurants/${reco.restaurantId}/` });
    if (ending && ending.id !== deal?.id) {
      const r = restaurantById(ending.restaurantId)!;
      const m = ending.mealId ? mealById(ending.mealId) : undefined;
      list.push({ key: "ending", label: t.home.hl.promo, color: "#E63462", title: l(ending.title), sub: l(r.name), img: m?.image ?? r.cover, emoji: r.emoji, href: `/restaurants/${r.id}/#offers`, countdown: ending.expiresAt });
    }
    list.push({ key: "top", label: t.home.hl.top, color: "#9BE15D", title: l(top.name), sub: `★ ${top.rating!.toFixed(1)} · ${l(top.tagline)}`, img: top.cover, emoji: top.emoji, href: `/restaurants/${top.id}/` });
    list.push({ key: "new", label: t.home.hl.new, color: "#7DD3FC", title: l(fresh.name), sub: l(fresh.tagline), img: fresh.cover, emoji: fresh.emoji, href: `/restaurants/${fresh.id}/` });
    if (promo && promo.id !== deal?.id) {
      const r = restaurantById(promo.restaurantId)!;
      list.push({ key: "promo", label: t.offerTags.exclusive, color: "#E9B5FF", title: l(promo.title), sub: l(r.name), img: r.cover, emoji: r.emoji, href: `/restaurants/${r.id}/#offers`, countdown: promo.expiresAt });
    }
    return list;
  }, [active, l, price, t, time]);

  return (
    <div className="scroll-row">
      {items.map((h, i) => (
        <Reveal key={h.key} delay={i * 0.05} className="w-64 sm:w-72">
          <Tilt>
            <Link href={h.href} className="sticker group relative block h-80 overflow-hidden">
              <FoodImage src={h.img} emoji={h.emoji} alt={h.title} className="absolute inset-0 size-full transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
              <span className="absolute start-3 top-3 rounded-full border-2 border-ink px-3 py-1 text-sm font-extrabold shadow-[2px_2px_0_#2B1B3D]" style={{ background: h.color }}>
                {h.label}
              </span>
              <div className="absolute inset-x-0 bottom-0 space-y-1 p-4 text-white">
                <h3 className="font-display text-2xl font-bold leading-tight">{h.title}</h3>
                <p className="line-clamp-1 text-sm text-white/85">{h.sub}</p>
                {h.countdown && (
                  <div className="inline-block rounded-full bg-white px-2 py-0.5 text-sm text-ink">
                    <Countdown to={h.countdown} compact />
                  </div>
                )}
              </div>
              <span className="pointer-events-none absolute inset-y-0 -start-1/2 w-1/3 animate-shine bg-white/20" />
            </Link>
          </Tilt>
        </Reveal>
      ))}
    </div>
  );
}

function MoodSection() {
  const { t } = useI18n();
  const [mood, setMood] = useState<Mood | null>(null);
  const [seed, setSeed] = useState(0);
  const dist = useDistances();
  const { active } = useOffers();
  const favs = useStore((s) => s.favorites);
  const views = useStore((s) => s.views);
  const now = useNow(60_000);

  const results = useMemo(() => {
    if (!mood) return [];
    let x = seed * 9301 + 49297;
    const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
    return recommend({ mood, time: now ? mealTimeAt(now) : undefined, distances: dist, activeOffers: active, favRestaurants: favs.restaurants, favCategories: favs.categories, viewed: views, random: rnd }, 8);
  }, [mood, seed, dist, active, favs, views, now]);

  const offerFor = (id: string) => active.find((o) => o.mealId === id);

  return (
    <section id="mood" className="scroll-mt-28 border-b-2 border-ink bg-lagoon/10 py-12">
      <Container>
        <Reveal>
          <SectionHeader title={t.home.mood} subtitle={t.home.moodSub} emoji="🫶" />
        </Reveal>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
          {MOODS.map((m, i) => (
            <Reveal key={m.id} delay={i * 0.03}>
              <motion.button
                type="button"
                whileHover={{ y: -5, rotate: i % 2 ? 3 : -3 }}
                whileTap={{ scale: 0.92 }}
                aria-pressed={mood === m.id}
                onClick={() => {
                  setMood(m.id);
                  setSeed((s) => s + 1);
                }}
                className="sticker flex h-full w-full flex-col items-center gap-1 p-3 text-center text-sm font-bold aria-pressed:ring-4 aria-pressed:ring-ink"
                style={{ background: mood === m.id ? m.c : "white" }}
              >
                <span className="text-4xl">{m.e}</span>
                {t.moods[m.id]}
              </motion.button>
            </Reveal>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {mood && (
            <motion.div key={`${mood}-${seed}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display text-2xl font-bold">{t.moodResults(t.moods[mood])}</h3>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-light btn-sm" onClick={() => setSeed((s) => s + 1)}>
                    🔀 {t.picker.result.again}
                  </button>
                  <Link href="/picker/" className="btn btn-lagoon btn-sm">
                    🎡 {t.nav.spin}
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {results.map((m, i) => (
                  <motion.div key={m.id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                    <MealCard m={m} offer={offerFor(m.id)} km={dist[m.restaurantId]} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </section>
  );
}

function GamesTeaser() {
  const { t } = useI18n();
  const games = [
    { href: "/games/battle/", e: "⚔️", title: t.games.battle.title, desc: t.games.battle.desc, c: "#F2542D" },
    { href: "/games/mystery/", e: "🎁", title: t.games.mystery.title, desc: t.games.mystery.desc, c: "#FFD23F" },
    { href: "/games/challenges/", e: "🎯", title: t.games.challenges.title, desc: t.games.challenges.desc, c: "#9BE15D" },
    { href: "/games/group/", e: "👯", title: t.games.group.title, desc: t.games.group.desc, c: "#7DD3FC" },
  ];
  return (
    <section className="relative overflow-hidden border-b-2 border-ink bg-lagoon py-14 text-white">
      <div className="dots-bg absolute inset-0 opacity-30" />
      <Container className="relative">
        <Reveal>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-4xl font-extrabold sm:text-5xl">🎮 {t.home.gamesTitle}</h2>
              <p className="mt-1 text-white/85">{t.home.gamesSub}</p>
            </div>
            <Link href="/games/" className="btn btn-sun">
              {t.home.play} <ArrowLeft className="size-4 ltr:rotate-180" />
            </Link>
          </div>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {games.map((g, i) => (
            <Reveal key={g.href} delay={i * 0.06}>
              <Tilt>
                <Link href={g.href} className="sticker flex h-full flex-col gap-2 p-5 text-ink" style={{ background: g.c }}>
                  <motion.span className="text-5xl" whileHover={{ scale: 1.3, rotate: 12 }}>
                    {g.e}
                  </motion.span>
                  <h3 className="font-display text-2xl font-bold">{g.title}</h3>
                  <p className="text-sm font-medium">{g.desc}</p>
                </Link>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ForNow({ offerFor }: { offerFor: Record<string, ReturnType<typeof useOffers>["active"][number]> }) {
  const now = useNow(60_000);
  const dist = useDistances();
  const meals = useMemo(() => recommend({ time: now ? mealTimeAt(now) : "lunch", distances: dist, random: () => 0.5 }, 8), [now, dist]);
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {meals.map((m) => (
        <MealCard key={m.id} m={m} offer={offerFor[m.id]} km={dist[m.restaurantId]} />
      ))}
    </div>
  );
}


