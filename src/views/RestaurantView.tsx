"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Bike, Flag, Navigation, Phone, Share2, ShoppingBag, Store } from "lucide-react";
import { categoryById } from "@/data/categories";
import { areaById } from "@/data/geo";
import { mealsByRestaurant } from "@/data/meals";
import { RESTAURANTS, restaurantById } from "@/data/restaurants";
import { useI18n } from "@/lib/i18n";
import { useDistances, useNow, useOffers } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { directionsUrl } from "@/lib/geo";
import { kuwaitParts } from "@/lib/time";
import { MealCard, OfferCard, RestaurantCard } from "@/components/cards";
import { Container, cx, DemoBadge, DistanceTag, FavButton, FoodImage, OpenBadge, PriceLevel, RatingBadge, Reveal, SectionHeader, Sheet } from "@/components/ui";

const MapView = dynamic(() => import("@/components/MapView").then((m) => m.MapView), { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-[1.25rem] bg-ink/10" /> });

export function RestaurantView({ id }: { id: string }) {
  const r = restaurantById(id)!;
  const { t, l, clock, date } = useI18n();
  const dist = useDistances();
  const { active } = useOffers();
  const now = useNow(60_000);
  const trackView = useStore((s) => s.trackView);
  const showToast = useStore((s) => s.showToast);
  const [report, setReport] = useState(false);
  const meals = mealsByRestaurant(r.id);
  const offers = active.filter((o) => o.restaurantId === r.id);
  const area = areaById(r.areaId)!;
  const today = now ? kuwaitParts(now).day : -1;

  useEffect(() => {
    trackView(r.id);
  }, [r.id, trackView]);

  const similar = RESTAURANTS.filter((x) => x.id !== r.id)
    .map((x) => ({ x, s: x.categories.filter((c) => r.categories.includes(c)).length * 3 - Math.abs(x.priceLevel - r.priceLevel) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 4)
    .map((v) => v.x);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: l(r.name), url });
      else {
        await navigator.clipboard.writeText(url);
        showToast(t.common.copied, "🔗");
      }
    } catch {
      /* user cancelled */
    }
  };

  const days = [0, 1, 2, 3, 4, 5, 6] as const;

  return (
    <>
      {/* Cover */}
      <section className="relative h-72 overflow-hidden border-b-2 border-ink sm:h-96">
        <FoodImage src={r.cover} emoji={r.emoji} alt={l(r.name)} size="full" className="absolute inset-0 size-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
        <Container className="relative flex h-full items-end pb-6">
          <div className="flex w-full flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 items-end gap-4">
              <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} className="grid size-20 shrink-0 place-items-center rounded-3xl border-2 border-ink text-5xl shadow-[4px_4px_0_#2B1B3D] sm:size-24" style={{ background: r.brand }}>
                {r.emoji}
              </motion.div>
              <div className="min-w-0 text-white">
                <div className="mb-1 flex flex-wrap gap-1.5">
                  <DemoBadge source={r.source} />
                  {r.isNew && <span className="rounded-full border-2 border-ink bg-lime px-2 py-0.5 text-xs font-extrabold text-ink">{t.common.newPlace}</span>}
                </div>
                <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">{l(r.name)}</h1>
                <p className="text-white/85">{l(r.tagline)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <FavButton kind="restaurants" id={r.id} />
              <button type="button" onClick={share} className="grid size-10 place-items-center rounded-full border-2 border-ink bg-white shadow-[2px_2px_0_#2B1B3D]" aria-label={t.common.share}>
                <Share2 className="size-5" />
              </button>
            </div>
          </div>
        </Container>
      </section>

      {/* Quick facts */}
      <Container className="-mt-1">
        <div className="sticker relative z-10 -mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 p-4">
          <RatingBadge rating={r.rating} count={r.ratingCount} />
          <PriceLevel level={r.priceLevel} />
          <OpenBadge hours={r.hours} />
          <DistanceTag km={dist[r.id]} />
          <span className="text-sm font-semibold">📍 {l(area.name)}</span>
          {r.delivery && <span className="inline-flex items-center gap-1 text-sm font-semibold"><Bike className="size-4" /> {t.common.delivery}</span>}
          {r.dineIn && <span className="inline-flex items-center gap-1 text-sm font-semibold"><Store className="size-4" /> {t.common.dineIn}</span>}
          <span className="ms-auto text-xs text-ink-soft" suppressHydrationWarning>{t.common.updated(date(r.updatedAt))}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={directionsUrl(r.lat, r.lng)} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
            <Navigation className="size-4" /> {t.common.directions}
          </a>
          {r.phone && (
            <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="btn btn-light btn-sm" dir="ltr">
              <Phone className="size-4" /> {t.common.call}
            </a>
          )}
          {r.orderUrl && (
            <a href={r.orderUrl} target="_blank" rel="noreferrer" className="btn btn-lime btn-sm">
              <ShoppingBag className="size-4" /> {t.common.order}
            </a>
          )}
          <Link href={`/picker/?mode=meal`} className="btn btn-lagoon btn-sm">🎡 {t.nav.picker}</Link>
        </div>
      </Container>

      <Container className="grid gap-10 py-10 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-12">
          <Reveal>
            <h2 className="mb-2 font-display text-3xl font-bold">{t.restaurant.about}</h2>
            <p className="text-lg leading-relaxed text-ink/85">{l(r.description)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {r.categories.map((c) => {
                const cat = categoryById(c);
                return (
                  <Link key={c} href={`/discover/?c=${c}`} className="chip" style={{ background: cat.color }}>
                    {cat.emoji} {l(cat.name)}
                  </Link>
                );
              })}
            </div>
          </Reveal>

          <section id="offers" className="scroll-mt-32">
            <SectionHeader title={t.restaurant.offers} emoji="🏷️" />
            {offers.length ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {offers.map((o) => <OfferCard key={o.id} o={o} km={dist[r.id]} />)}
              </div>
            ) : (
              <p className="sticker p-5 font-semibold text-ink-soft">{t.restaurant.noOffers}</p>
            )}
          </section>

          <section>
            <SectionHeader title={t.restaurant.menu} emoji="📜" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {meals.map((m) => (
                <div key={m.id} id={`meal-${m.id}`} className="scroll-mt-32 target:animate-wiggle">
                  <MealCard m={m} offer={offers.find((o) => o.mealId === m.id)} />
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader title={t.restaurant.reviews} emoji="💬" />
            <div className="sticker flex flex-wrap items-center gap-6 p-5">
              <div className="text-center">
                <div className="font-display text-5xl font-extrabold">{r.rating?.toFixed(1) ?? "—"}</div>
                <RatingBadge rating={r.rating} count={r.ratingCount} />
              </div>
              <p className="flex-1 text-sm text-ink-soft">{t.restaurant.reviewsSoon}</p>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="sticker p-5">
            <h2 className="mb-3 font-display text-xl font-bold">🕒 {t.restaurant.hours}</h2>
            {r.hours ? (
              <ul className="space-y-1.5">
                {days.map((d) => {
                  const h = r.hours!.overrides?.[d] ?? r.hours!.default;
                  return (
                    <li key={d} className={cx("flex justify-between gap-3 rounded-lg px-2 py-1 text-sm", d === today && "bg-sun/40 font-bold")}>
                      <span>{t.restaurant.days[d]}</span>
                      <span dir="ltr">{h === "closed" ? t.restaurant.closedDay : `${clock(h.open)} – ${clock(h.close)}`}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm font-semibold text-ink-soft">{t.common.hoursUnknown}</p>
            )}
          </div>
          <div className="sticker p-3">
            <h2 className="mb-3 px-2 font-display text-xl font-bold">📍 {t.restaurant.location}</h2>
            <MapView center={{ lat: r.lat, lng: r.lng }} zoom={14} markers={[{ id: r.id, lat: r.lat, lng: r.lng, emoji: r.emoji, color: r.brand, label: l(r.name) }]} className="h-64" />
            <p className="px-2 pt-2 text-xs text-ink-soft">{l(area.name)} · {t.common.demoData}</p>
          </div>
          {r.phone && (
            <div className="sticker p-5">
              <h2 className="mb-2 font-display text-xl font-bold">☎️ {t.restaurant.contact}</h2>
              <p dir="ltr" className="text-end font-semibold rtl:text-start">{r.phone}</p>
            </div>
          )}
          <button type="button" onClick={() => setReport(true)} className="btn btn-light btn-sm w-full">
            <Flag className="size-4" /> {t.common.report}
          </button>
        </aside>
      </Container>

      <Container className="pb-6">
        <SectionHeader title={t.restaurant.similar} emoji="🔁" href="/restaurants/" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {similar.map((x) => <RestaurantCard key={x.id} r={x} km={dist[x.id]} offers={active.filter((o) => o.restaurantId === x.id).length} />)}
        </div>
      </Container>

      <Sheet open={report} onClose={() => setReport(false)} title={t.common.report}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setReport(false);
            showToast(t.common.reportThanks, "🙏");
          }}
        >
          {[t.restaurant.hours, t.common.price, t.restaurant.location, t.restaurant.offers, t.restaurant.contact].map((x) => (
            <label key={x} className="flex items-center gap-2 font-semibold">
              <input type="checkbox" className="size-5 accent-brand" /> {x}
            </label>
          ))}
          <textarea className="input min-h-24" placeholder="…" />
          <button className="btn btn-primary w-full">{t.common.report}</button>
        </form>
      </Sheet>
    </>
  );
}
