"use client";
import Link from "next/link";
import { useMemo } from "react";
import { motion } from "motion/react";
import { Info } from "lucide-react";
import { categoryById } from "@/data/categories";
import { MEALS } from "@/data/meals";
import { RESTAURANTS, restaurantById } from "@/data/restaurants";
import { useI18n } from "@/lib/i18n";
import { useDistances, useMounted, useOffers } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { MealCard, RestaurantCard } from "@/components/cards";
import { Container, FoodImage, PageHero, RatingBadge, Reveal, SectionHeader } from "@/components/ui";
import { LiveSoon } from "@/components/LiveSoon";
import { HAS_LISTINGS } from "@/data/live";

function Note({ children, tone = "#FFF7CC" }: { children: React.ReactNode; tone?: string }) {
  return (
    <p className="mb-5 flex items-start gap-2 rounded-2xl border-2 border-ink/20 p-3 text-sm font-semibold" style={{ background: tone }}>
      <Info className="mt-0.5 size-4 shrink-0" /> {children}
    </p>
  );
}

export function TrendingView() {
  const { t, l } = useI18n();
  const mounted = useMounted();
  const dist = useDistances();
  const { active } = useOffers();
  const views = useStore((s) => s.views);
  const categoryViews = useStore((s) => s.categoryViews);
  const favMeals = useStore((s) => s.favorites.meals);

  const picks = MEALS.filter((m) => m.editorsPick).slice(0, 8);
  const topRated = [...RESTAURANTS].filter((r) => r.rating).sort((a, b) => b.rating! - a.rating!).slice(0, 5);
  const newest = RESTAURANTS.filter((r) => r.isNew);
  const yourTop = useMemo(() => (mounted ? Object.entries(views).sort((a, b) => b[1] - a[1]).slice(0, 5) : []), [views, mounted]);

  if (!HAS_LISTINGS)
    return (
      <>
        <PageHero title={t.trending.title} subtitle={t.trending.subtitle} emoji="🔥" color="#E63462" />
        <Container className="py-10">
          <LiveSoon />
        </Container>
      </>
    );

  return (
    <>
      <PageHero title={t.trending.title} subtitle={t.trending.subtitle} emoji="🔥" color="#E63462" />
      <Container className="space-y-14 py-10">
        <section>
          <Reveal><SectionHeader title={t.trending.editorial} emoji="✍️" /></Reveal>
          <Note>{t.trending.editorialNote}</Note>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {picks.map((m) => <MealCard key={m.id} m={m} offer={active.find((o) => o.mealId === m.id)} km={dist[m.restaurantId]} />)}
          </div>
        </section>

        <section className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2">
          <div>
            <SectionHeader title={t.trending.topRated} emoji="⭐" />
            <ol className="space-y-3">
              {topRated.map((r, i) => (
                <motion.li key={r.id} initial={{ x: -30, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <Link href={`/restaurants/${r.id}/`} className="sticker flex items-center gap-4 p-3 hover:shadow-[6px_6px_0_#2B1B3D]">
                    <span className="font-display text-4xl font-extrabold text-brand" style={{ WebkitTextStroke: "1.5px #2B1B3D" }}>#{i + 1}</span>
                    <FoodImage src={r.cover} emoji={r.emoji} alt="" size="small" className="size-14 shrink-0 rounded-xl border-2 border-ink" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold">{l(r.name)}</div>
                      <div className="text-sm text-ink-soft">{r.categories.map((c) => categoryById(c).emoji).join(" ")}</div>
                    </div>
                    <RatingBadge rating={r.rating} compact />
                  </Link>
                </motion.li>
              ))}
            </ol>
          </div>
          <div>
            <SectionHeader title={t.trending.yours} emoji="👤" />
            <Note tone="#E0F2FE">{t.trending.yoursNote}</Note>
            {yourTop.length ? (
              <ol className="space-y-3">
                {yourTop.map(([id, n], i) => {
                  const r = restaurantById(id);
                  if (!r) return null;
                  return (
                    <li key={id}>
                      <Link href={`/restaurants/${id}/`} className="sticker flex items-center gap-3 p-3">
                        <span className="font-display text-2xl font-bold">#{i + 1}</span>
                        <span className="text-2xl">{r.emoji}</span>
                        <span className="flex-1 truncate font-bold">{l(r.name)}</span>
                        <span className="rounded-full bg-lagoon/10 px-2 text-sm font-bold text-lagoon">👀 {n}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="sticker p-5 font-semibold text-ink-soft">{t.trending.noActivity}</p>
            )}
            {mounted && (categoryViews.length > 0 || favMeals.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {categoryViews.map((c) => {
                  const cat = categoryById(c as never);
                  return cat ? <span key={c} className="chip" style={{ background: cat.color }}>{cat.emoji} {l(cat.name)}</span> : null;
                })}
              </div>
            )}
          </div>
        </section>

        <section>
          <SectionHeader title={t.trending.community} emoji="📈" />
          <Note tone="#F3E8FF">{t.trending.communityNote}</Note>
        </section>

        <section>
          <SectionHeader title={t.trending.newest} emoji="🆕" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {newest.map((r) => <RestaurantCard key={r.id} r={r} km={dist[r.id]} offers={active.filter((o) => o.restaurantId === r.id).length} />)}
          </div>
        </section>
      </Container>
    </>
  );
}
