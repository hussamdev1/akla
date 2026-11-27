"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { areaById, regionsIn } from "@/data/geo";
import { useI18n } from "@/lib/i18n";
import { useNow } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { haversineKm, locationPoint } from "@/lib/geo";
import { norm } from "@/lib/search";
import { openState } from "@/lib/time";
import { usePlaces, type Place } from "@/lib/places";
import type { CategoryId } from "@/lib/types";
import { PlaceCard } from "./cards";
import { EmptyState, Loader, Toggle } from "./ui";

const PAGE = 30;

export function RealPlacesDirectory() {
  const { t, l, date } = useI18n();
  const { status, places, fetchedAt, live, radiusKm, retry } = usePlaces();
  const loc = useStore((s) => s.location);
  const country = useStore((s) => s.country);
  const regions = regionsIn(country);
  const me = useMemo(() => locationPoint(loc, country), [loc, country]);
  const now = useNow(60_000);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CategoryId | "">("");
  const [gov, setGov] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  const list = useMemo(() => {
    const nq = norm(q);
    return places
      .filter((p: Place) => {
        if (nq && !norm(`${p.name.ar} ${p.name.en} ${p.cuisineText ?? ""} ${p.brand ?? ""}`).includes(nq)) return false;
        if (cat && !p.categories.includes(cat)) return false;
        if (gov && (!p.areaId || areaById(p.areaId)?.region !== gov)) return false;
        if (openNow && (!now || openState(p.hours, now).status !== "open")) return false;
        return true;
      })
      .map((p) => ({ p, d: haversineKm(me, p) }))
      .sort((a, b) => a.d - b.d);
  }, [places, q, cat, gov, openNow, now, me]);

  if (status === "loading") return <Loader label={live ? t.nearby.osmLoading : t.places.loading} />;
  if (status === "error") return <EmptyState title={t.nearby.osmError} action={<button type="button" className="btn btn-primary" onClick={retry}>{t.region.retry}</button>} />;

  return (
    <div>
      <p className="mb-4 rounded-2xl border-2 border-lagoon/40 bg-lagoon/10 p-3 text-sm font-semibold">
        🗺️ {t.places.subtitle(places.length)}. {t.places.noRating}
        {live && <span> {t.region.liveNote}{radiusKm ? ` (≤ ${radiusKm} ${t.common.km})` : ""}</span>}
        {fetchedAt && <span className="text-ink-soft" suppressHydrationWarning> · {t.places.snapshot(date(fetchedAt))}</span>}
      </p>
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
        <label className="relative">
          <Search className="absolute start-3 top-1/2 size-5 -translate-y-1/2 text-ink-soft" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} placeholder={t.places.searchPh} className="input ps-11" />
        </label>
        {regions.length > 0 ? (
          <select className="input md:w-48" value={gov} onChange={(e) => { setGov(e.target.value); setLimit(PAGE); }} aria-label={t.offersPage.filterArea}>
            <option value="">📍 {t.common.all}</option>
            {regions.map((g) => <option key={g.id} value={g.id}>{l(g.name)}</option>)}
          </select>
        ) : <span className="hidden md:block" />}
        <div className="rounded-2xl border-2 border-ink bg-white px-3 py-2">
          <Toggle checked={openNow} onChange={(v) => { setOpenNow(v); setLimit(PAGE); }} label={`🟢 ${t.restaurantsPage.openNow}`} />
        </div>
      </div>
      <div className="scroll-row mb-4 !pb-2">
        <button type="button" className="chip" aria-pressed={cat === ""} onClick={() => setCat("")}>✨ {t.common.all}</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" className="chip !text-xs" aria-pressed={cat === c.id} onClick={() => { setCat(c.id); setLimit(PAGE); }}>
            {c.emoji} {l(c.name)}
          </button>
        ))}
      </div>
      <p className="mb-3 font-bold">{t.common.results(list.length)}</p>
      {list.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.slice(0, limit).map(({ p, d }) => <PlaceCard key={p.id} p={p} km={d} />)}
          </div>
          {limit < list.length && (
            <div className="mt-6 flex justify-center">
              <button type="button" className="btn btn-light" onClick={() => setLimit((n) => n + PAGE)}>{t.places.loadMore}</button>
            </div>
          )}
        </>
      ) : (
        <EmptyState title={t.common.noResults} />
      )}
    </div>
  );
}
