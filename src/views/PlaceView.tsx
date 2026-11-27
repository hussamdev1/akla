"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { AtSign, ExternalLink, Flag, Globe, Navigation, Phone } from "lucide-react";
import { categoryById } from "@/data/categories";
import { areaOf } from "@/data/geo";
import { countryName } from "@/lib/region";
import { useI18n } from "@/lib/i18n";
import { useNow } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { directionsUrl, haversineKm, locationPoint } from "@/lib/geo";
import { localParts } from "@/lib/time";
import { loadPlaceById, osmUrl, usePlaces, type Place } from "@/lib/places";
import { PlaceCard } from "@/components/cards";
import { Container, cx, DemoBadge, DistanceTag, EmptyState, Loader, OpenBadge, SectionHeader } from "@/components/ui";
import { QueryParam } from "@/components/QueryParam";

const MapView = dynamic(() => import("@/components/MapView").then((m) => m.MapView), { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-[1.25rem] bg-ink/10" /> });

export function PlaceView() {
  const { t, l, clock, date, locale } = useI18n();
  const [id, setId] = useState<string | null>(null);
  const onId = useCallback((v: string | null) => setId(v), []);
  const { status, places, fetchedAt } = usePlaces();
  const loc = useStore((s) => s.location);
  const country = useStore((s) => s.country);
  const me = useMemo(() => locationPoint(loc, country), [loc, country]);
  const now = useNow(60_000);
  const today = now ? localParts(now).day : -1;

  const found = places.find((x) => x.id === id);
  // Not in the loaded snapshot / live area (e.g. a shared link from another city): look the place up by id.
  const [byId, setById] = useState<{ id: string; p?: Place } | null>(null);
  useEffect(() => {
    if (status === "loading" || !id || found) return;
    let alive = true;
    void loadPlaceById(id, country).then((x) => alive && setById({ id, p: x }));
    return () => {
      alive = false;
    };
  }, [status, id, found, country]);
  const p = found ?? (byId?.id === id ? byId.p : undefined);
  const lookingUp = !found && !!id && status !== "loading" && byId?.id !== id;
  const nearby = useMemo(
    () =>
      p
        ? places
            .filter((x) => x.id !== p.id && x.categories.some((c) => p.categories.includes(c)))
            .map((x) => ({ x, d: haversineKm(p, x) }))
            .sort((a, b) => a.d - b.d)
            .slice(0, 6)
        : [],
    [p, places],
  );

  return (
    <>
      <QueryParam name="id" onValue={onId} />
      {status === "loading" || lookingUp || (status === "ready" && id === null) ? (
        <Loader label={t.places.loading} />
      ) : !p ? (
        <div className="px-4 py-20">
          <EmptyState title={t.places.notFound} action={<Link href="/restaurants/?tab=all" className="btn btn-primary">{t.places.title(countryName(country, locale))}</Link>} />
        </div>
      ) : (
        <>
          <section className="border-b-2 border-ink bg-lagoon/15">
            <Container className="py-8">
              <div className="flex flex-wrap items-center gap-4">
                <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} className="sticker grid size-20 shrink-0 place-items-center text-5xl" style={{ background: p.categories[0] ? categoryById(p.categories[0]).color : "#FFEBD6" }}>
                  {p.emoji}
                </motion.span>
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap gap-2">
                    <DemoBadge source="osm" />
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold">{t.places.kinds[p.kind]}</span>
                  </div>
                  <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">{l(p.name)}</h1>
                  {p.name.ar !== p.name.en && <p className="font-semibold text-ink-soft">{l({ ar: p.name.en, en: p.name.ar })}</p>}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <OpenBadge hours={p.hours} />
                <DistanceTag km={haversineKm(me, p)} />
                {areaOf(p) && <span className="text-sm font-semibold">📍 {l(areaOf(p)!.name)}</span>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={directionsUrl(p.lat, p.lng)} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm"><Navigation className="size-4" /> {t.common.directions}</a>
                {p.phone && <a href={`tel:${p.phone.replace(/\s/g, "")}`} className="btn btn-light btn-sm" dir="ltr"><Phone className="size-4" /> {t.common.call}</a>}
                {p.website && <a href={p.website} target="_blank" rel="noreferrer" className="btn btn-light btn-sm"><Globe className="size-4" /> {t.places.website}</a>}
                {p.instagram && <a href={p.instagram.startsWith("http") ? p.instagram : `https://instagram.com/${p.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="btn btn-light btn-sm"><AtSign className="size-4" /> {t.places.instagram}</a>}
              </div>
            </Container>
          </section>

          <Container className="grid gap-8 py-8 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-6">
              <MapView center={{ lat: p.lat, lng: p.lng }} zoom={16} markers={[{ id: p.id, lat: p.lat, lng: p.lng, emoji: p.emoji, color: "#FFD23F", label: l(p.name) }]} className="h-72" />
              <div className="sticker space-y-2 p-5">
                <p className="font-semibold">ℹ️ {t.places.noRating}</p>
                <p className="text-sm text-ink-soft">
                  {t.places.cuisine}: {p.cuisineText ?? t.places.unknownCuisine}
                  {p.vegetarian && ` · 🌱 ${t.places.veg}`}
                  {p.delivery && ` · 🛵 ${t.places.delivery}`}
                </p>
                {p.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {p.categories.map((c) => (
                      <Link key={c} href={`/discover/?c=${c}`} className="chip" style={{ background: categoryById(c).color }}>
                        {categoryById(c).emoji} {l(categoryById(c).name)}
                      </Link>
                    ))}
                  </div>
                )}
                <p className="pt-2 text-sm font-semibold text-lagoon">🍽️ {t.places.ownerCta}</p>
              </div>
            </div>
            <aside className="space-y-4">
              <div className="sticker p-5">
                <h2 className="mb-3 font-display text-xl font-bold">🕒 {t.restaurant.hours}</h2>
                {p.hours?.allDay ? (
                  <p className="font-bold">{clock("24/7")}</p>
                ) : p.hours ? (
                  <ul className="space-y-1.5">
                    {([0, 1, 2, 3, 4, 5, 6] as const).map((d) => {
                      const h = p.hours!.overrides?.[d] ?? p.hours!.default;
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
                {p.hoursText && !p.hours && (
                  <p className="mt-2 text-xs text-ink-soft">
                    {t.places.hoursRaw}: <span dir="ltr">{p.hoursText}</span>
                  </p>
                )}
              </div>
              <a href={osmUrl(p.id)} target="_blank" rel="noreferrer" className="btn btn-light btn-sm w-full">
                <Flag className="size-4" /> {t.places.editOsm} <ExternalLink className="size-3.5" />
              </a>
              {fetchedAt && <p className="text-center text-xs text-ink-soft" suppressHydrationWarning>{t.places.snapshot(date(fetchedAt))}</p>}
            </aside>
          </Container>

          {nearby.length > 0 && (
            <Container className="pb-8">
              <SectionHeader title={t.restaurant.similar} emoji="🔁" href="/restaurants/?tab=all" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {nearby.map(({ x }) => <PlaceCard key={x.id} p={x} km={haversineKm(me, x)} />)}
              </div>
            </Container>
          )}
        </>
      )}
    </>
  );
}
