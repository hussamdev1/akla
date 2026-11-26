"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Crosshair, ExternalLink, Globe, List, Map as MapIcon, Navigation, Phone, X } from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { MEALS } from "@/data/meals";
import { RESTAURANTS } from "@/data/restaurants";
import { useI18n } from "@/lib/i18n";
import { useDistances, useNow, useOffers } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { directionsUrl, haversineKm, locationPoint } from "@/lib/geo";
import { openState } from "@/lib/time";
import { osmUrl, usePlaces } from "@/lib/places";
import type { CategoryId } from "@/lib/types";
import { OfferCard, RestaurantCard } from "@/components/cards";
import { Container, cx, DemoBadge, DistanceTag, EmptyState, FavButton, FoodImage, Loader, OpenBadge, RatingBadge, SectionHeader, Toggle } from "@/components/ui";
import { LocationPill } from "@/components/shell/LocationPicker";
import type { MapMarker } from "@/components/MapView";

const MapView = dynamic(() => import("@/components/MapView").then((m) => m.MapView), { ssr: false, loading: () => <div className="h-full min-h-[24rem] animate-pulse rounded-[1.25rem] bg-ink/10" /> });

const RADII = [1.5, 3, 5, 10, 20, 60];

export function NearbyView() {
  const { t, l, km: fkm } = useI18n();
  const loc = useStore((s) => s.location);
  const setLocation = useStore((s) => s.setLocation);
  const point = useMemo(() => locationPoint(loc), [loc]);
  const dist = useDistances();
  const { active } = useOffers();
  const now = useNow(60_000);
  const [radius, setRadius] = useState(10);
  const [view, setView] = useState<"map" | "list">("map");
  const [cuisine, setCuisine] = useState<CategoryId | "">("");
  const [price, setPrice] = useState<number[]>([]);
  const [openNow, setOpenNow] = useState(false);
  const [dealsOnly, setDealsOnly] = useState(false);
  const [showDemo, setShowDemo] = useState(true);
  const [showOsm, setShowOsm] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [gpsErr, setGpsErr] = useState("");

  const offerCount = useMemo(() => {
    const m: Record<string, number> = {};
    for (const o of active) m[o.restaurantId] = (m[o.restaurantId] ?? 0) + 1;
    return m;
  }, [active]);

  const demo = useMemo(
    () =>
      RESTAURANTS.filter((r) => {
        if (radius < 60 && dist[r.id] > radius) return false;
        if (cuisine && !r.categories.includes(cuisine)) return false;
        if (price.length && !price.includes(r.priceLevel)) return false;
        if (openNow && (!now || openState(r.hours, now).status !== "open")) return false;
        if (dealsOnly && !offerCount[r.id]) return false;
        return true;
      }).sort((a, b) => dist[a.id] - dist[b.id]),
    [radius, cuisine, price, openNow, dealsOnly, dist, now, offerCount],
  );

  // Real places come from the OpenStreetMap snapshot built with the site (instant, no slow live query).
  const placesState = usePlaces(showOsm);
  const osmState = !showOsm ? "idle" : placesState.status === "ready" ? "done" : placesState.status;
  const osmAll = useMemo(
    () =>
      placesState.places
        .filter((p) => !cuisine || p.categories.includes(cuisine))
        .filter((p) => !openNow || (now && openState(p.hours, now).status === "open"))
        .map((p) => ({ p, d: haversineKm(point, p) }))
        .filter(({ d }) => radius >= 60 || d <= radius)
        .sort((a, b) => a.d - b.d),
    [placesState.places, cuisine, openNow, now, point, radius],
  );
  const osm = useMemo(() => osmAll.slice(0, 400).map(({ p }) => p), [osmAll]);

  const markers: MapMarker[] = [
    ...(showDemo ? demo.map((r) => ({ id: r.id, lat: r.lat, lng: r.lng, emoji: r.emoji, color: r.brand, label: l(r.name), kind: "demo" as const })) : []),
    ...(showOsm ? osm.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, emoji: p.emoji, color: "#fff", label: l(p.name), kind: "osm" as const })) : []),
  ];

  const zoom = radius <= 1.5 ? 15 : radius <= 3 ? 14 : radius <= 5 ? 13 : radius <= 10 ? 12 : radius <= 20 ? 11 : 10;
  const selDemo = RESTAURANTS.find((r) => r.id === selected);
  const selOsm = osm.find((p) => p.id === selected);

  const gps = () => {
    setGpsErr("");
    navigator.geolocation?.getCurrentPosition(
      (p) => setLocation({ kind: "gps", lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setGpsErr(t.nearby.gpsDenied),
      { timeout: 10000 },
    );
  };

  const nearbyDeals = active.filter((o) => dist[o.restaurantId] <= Math.max(radius, 5)).sort((a, b) => dist[a.restaurantId] - dist[b.restaurantId]).slice(0, 3);
  const popular = [...demo].filter((r) => r.rating).sort((a, b) => b.rating! - a.rating!).slice(0, 4);

  const listItems = (
    <div className="space-y-3">
      {showDemo && demo.map((r) => (
        <button key={r.id} type="button" onClick={() => setSelected(r.id)} className={cx("flex w-full items-center gap-3 rounded-2xl border-2 border-ink bg-white p-2 text-start transition-shadow", selected === r.id && "shadow-[3px_3px_0_#2B1B3D] ring-2 ring-brand")}>
          <FoodImage src={r.cover} emoji={r.emoji} alt="" size="small" className="size-16 shrink-0 rounded-xl border-2 border-ink" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-bold">{l(r.name)}</span>
              {offerCount[r.id] ? <span className="rounded-full bg-chili px-1.5 text-[10px] font-bold text-white">🏷️ {offerCount[r.id]}</span> : null}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 text-xs">
              <RatingBadge rating={r.rating} compact /> <DistanceTag km={dist[r.id]} />
            </div>
            <OpenBadge hours={r.hours} />
          </div>
        </button>
      ))}
      {showOsm && osm.slice(0, 60).map((p) => (
        <button key={p.id} type="button" onClick={() => setSelected(p.id)} className={cx("flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-ink/50 bg-white p-2 text-start", selected === p.id && "ring-2 ring-lagoon")}>
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-rice text-2xl">{p.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold">{l(p.name)}</div>
            <div className="truncate text-xs text-ink-soft">{p.cuisineText ?? t.places.kinds[p.kind]} · {fkm(haversineKm(point, p))}</div>
            <OpenBadge hours={p.hours} />
          </div>
        </button>
      ))}
      {showDemo && !demo.length && !showOsm && <EmptyState title={t.common.noResults} />}
    </div>
  );

  return (
    <>
      <section className="border-b-2 border-ink bg-[#7DD3FC]">
        <Container className="py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl font-extrabold sm:text-5xl">📍 {t.nearby.title}</h1>
              <p className="font-medium text-ink/80">{t.nearby.subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={gps} className="btn btn-lagoon btn-sm">
                <Crosshair className="size-4" /> {t.nearby.useGps}
              </button>
              <LocationPill />
            </div>
          </div>
          {gpsErr && <p className="mt-2 text-sm font-bold text-red-700">{gpsErr}</p>}
          <div className="scroll-row mt-4 !pb-1">
            {RADII.map((r) => (
              <button key={r} type="button" className="chip" aria-pressed={radius === r} onClick={() => setRadius(r)}>
                {r === 1.5 ? `🚶 ${t.nearby.walking}` : r === 60 ? `🚗 ${t.common.any}` : `🚗 ${fkm(r)}`}
              </button>
            ))}
          </div>
          <div className="scroll-row !pb-1">
            <select className="chip !pe-8" value={cuisine} onChange={(e) => setCuisine(e.target.value as CategoryId | "")} aria-label={t.nearby.cuisine}>
              <option value="">🍽️ {t.nearby.cuisine}: {t.common.all}</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {l(c.name)}</option>)}
            </select>
            {[1, 2, 3, 4].map((p) => (
              <button key={p} type="button" className="chip" dir="ltr" aria-pressed={price.includes(p)} onClick={() => setPrice((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]))}>
                {"$".repeat(p)}
              </button>
            ))}
            <button type="button" className="chip" aria-pressed={openNow} onClick={() => setOpenNow(!openNow)}>🟢 {t.restaurantsPage.openNow}</button>
            <button type="button" className="chip" aria-pressed={dealsOnly} onClick={() => setDealsOnly(!dealsOnly)}>🏷️ {t.restaurantsPage.withOffers}</button>
          </div>
        </Container>
      </section>

      <Container className="py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-4 rounded-2xl border-2 border-ink bg-white px-4 py-2">
            <Toggle checked={showDemo} onChange={setShowDemo} label={`🧪 ${t.nearby.layerDemo}`} />
            <Toggle checked={showOsm} onChange={setShowOsm} label={`🗺️ ${t.nearby.layerOsm}`} />
          </div>
          <div className="flex rounded-full border-2 border-ink bg-white p-1 lg:hidden">
            {(["map", "list"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} className={cx("inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold", view === v && "bg-ink text-white")}>
                {v === "map" ? <MapIcon className="size-4" /> : <List className="size-4" />} {t.nearby[v]}
              </button>
            ))}
          </div>
        </div>

        {showOsm && (
          <div className="mb-4 rounded-2xl border-2 border-lagoon bg-lagoon/10 p-3 text-sm font-semibold">
            {osmState === "loading" && <Loader label={t.nearby.osmLoading} />}
            {osmState === "error" && <span className="text-red-700">{t.nearby.osmError}</span>}
            {osmState === "done" && (
              <span>
                ✅ {t.nearby.osmCount(osmAll.length)} · {t.nearby.osmNote}
              </span>
            )}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
          <div className={cx("relative h-[65dvh] min-h-[24rem]", view === "list" && "hidden lg:block")}>
            <MapView center={point} zoom={zoom} markers={markers} user={point} radiusKm={radius < 60 ? radius : undefined} selected={selected} onSelect={setSelected} className="h-full" />
            <AnimatePresence>
              {(selDemo || selOsm) && (
                <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="sticker absolute inset-x-3 bottom-3 z-[500] p-3 sm:max-w-sm">
                  <button type="button" className="absolute end-2 top-2 grid size-7 place-items-center rounded-full border-2 border-ink bg-white" onClick={() => setSelected(null)} aria-label={t.common.close}>
                    <X className="size-4" />
                  </button>
                  {selDemo && (
                    <div className="flex gap-3">
                      <FoodImage src={selDemo.cover} emoji={selDemo.emoji} alt="" size="small" className="size-20 shrink-0 rounded-xl border-2 border-ink" />
                      <div className="min-w-0 flex-1 space-y-1 pe-6">
                        <div className="flex items-center gap-1.5"><b className="truncate">{l(selDemo.name)}</b><DemoBadge source={selDemo.source} /></div>
                        <div className="flex flex-wrap gap-2 text-xs"><RatingBadge rating={selDemo.rating} compact /><DistanceTag km={dist[selDemo.id]} /></div>
                        <OpenBadge hours={selDemo.hours} />
                        <div className="flex gap-2 pt-1">
                          <Link href={`/restaurants/${selDemo.id}/`} className="btn btn-primary btn-sm">{t.common.viewRestaurant}</Link>
                          <a href={directionsUrl(selDemo.lat, selDemo.lng)} target="_blank" rel="noreferrer" className="btn btn-light btn-sm" aria-label={t.common.directions}><Navigation className="size-4" /></a>
                          <FavButton kind="restaurants" id={selDemo.id} size="sm" />
                        </div>
                      </div>
                    </div>
                  )}
                  {selOsm && (
                    <div className="space-y-1 pe-6">
                      <div className="flex items-center gap-2"><span className="text-2xl">{selOsm.emoji}</span><b>{l(selOsm.name)}</b></div>
                      <p className="text-xs text-ink-soft">{selOsm.cuisineText ?? t.places.kinds[selOsm.kind]} · {fkm(haversineKm(point, selOsm))} · <span className="font-bold text-lagoon">{t.common.osm}</span></p>
                      <OpenBadge hours={selOsm.hours} />
                      <p className="text-xs text-ink-soft">{t.common.ratingUnknown}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Link href={`/place/?id=${selOsm.id}`} className="btn btn-primary btn-sm">{t.common.viewRestaurant}</Link>
                        <a href={directionsUrl(selOsm.lat, selOsm.lng)} target="_blank" rel="noreferrer" className="btn btn-light btn-sm" aria-label={t.common.directions}><Navigation className="size-4" /></a>
                        {selOsm.phone && <a href={`tel:${selOsm.phone}`} className="btn btn-light btn-sm"><Phone className="size-4" /></a>}
                        {selOsm.website && <a href={selOsm.website} target="_blank" rel="noreferrer" className="btn btn-light btn-sm"><Globe className="size-4" /></a>}
                        <a href={osmUrl(selOsm.id)} target="_blank" rel="noreferrer" className="btn btn-light btn-sm"><ExternalLink className="size-4" /> OSM</a>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className={cx("max-h-[65dvh] overflow-y-auto pe-1", view === "map" && "hidden lg:block")}>{listItems}</div>
        </div>
      </Container>

      <Container className="space-y-12 py-8">
        {nearbyDeals.length > 0 && (
          <section>
            <SectionHeader title={t.nearby.dealsNearby} emoji="🏷️" href="/offers/" />
            <div className="grid gap-5 md:grid-cols-3">{nearbyDeals.map((o) => <OfferCard key={o.id} o={o} km={dist[o.restaurantId]} />)}</div>
          </section>
        )}
        {popular.length > 0 && (
          <section>
            <SectionHeader title={t.nearby.popularNearby} subtitle={t.trending.topRated} emoji="⭐" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {popular.map((r) => <RestaurantCard key={r.id} r={r} km={dist[r.id]} offers={offerCount[r.id] ?? 0} featuredMeal={MEALS.find((m) => m.restaurantId === r.id && m.editorsPick)} />)}
            </div>
          </section>
        )}
      </Container>
    </>
  );
}
