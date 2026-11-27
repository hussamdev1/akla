"use client";
import { useMemo, useState } from "react";
import { ArrowRight, Crosshair, Globe2, MapPin, Search, X } from "lucide-react";
import { areaById, areasIn, regionsIn } from "@/data/geo";
import { countryAt, searchCity, type CityHit } from "@/lib/geocode";
import { useMounted } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { COUNTRY_CODES, countryFromDeviceTz, countryName, defaultCity, flag, isFeatured } from "@/lib/region";
import { FEATURED_COUNTRIES } from "@/data/geo";
import { norm } from "@/lib/search";
import { useStore } from "@/lib/store";
import type { Area, UserLocation } from "@/lib/types";
import { cx, Sheet } from "../ui";

/** Use a GPS fix; one cached reverse lookup tells us whether the user is in another country. */
export async function applyGpsFix(lat: number, lng: number) {
  const here: UserLocation = { kind: "gps", lat, lng };
  const cc = await countryAt(lat, lng);
  const st = useStore.getState();
  if (cc && cc !== st.country) st.setCountry(cc, here);
  else st.setLocation(here);
}

export function useLocationLabel() {
  const loc = useStore((s) => s.location);
  const { l, t } = useI18n();
  if (loc.kind === "gps") return t.region.myLocation;
  if (loc.kind === "city") return l(loc.name);
  const a = areaById(loc.areaId);
  return a ? l(a.name) : "";
}

export function LocationPill({ className, dark }: { className?: string; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const label = useLocationLabel();
  const country = useStore((s) => s.country);
  const { t } = useI18n();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cx("inline-flex max-w-[13rem] items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1.5 text-sm font-bold", dark ? "bg-ink text-white" : "bg-white", className)}
        aria-label={t.header.location}
      >
        <MapPin className="size-4 shrink-0 text-brand" />
        <span className="shrink-0" aria-hidden suppressHydrationWarning>
          {flag(country)}
        </span>
        <span className="truncate" suppressHydrationWarning>
          {label}
        </span>
      </button>
      <LocationSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function LocationSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, locale } = useI18n();
  const country = useStore((s) => s.country);
  const [picking, setPicking] = useState(false);
  const close = () => {
    setPicking(false);
    onClose();
  };
  return (
    <Sheet open={open} onClose={close} title={picking ? t.region.pickCountry : t.nearby.pickArea}>
      {picking ? (
        <CountryList
          onPick={(cc) => {
            useStore.getState().setCountry(cc);
            setPicking(false);
          }}
        />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-rice px-3 py-2">
            <span className="flex min-w-0 items-center gap-2 font-bold">
              <span className="text-2xl" aria-hidden>{flag(country)}</span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t.region.country}</span>
                <span className="block truncate">{countryName(country, locale)}</span>
              </span>
            </span>
            <button type="button" className="btn btn-light btn-sm shrink-0" onClick={() => setPicking(true)}>
              <Globe2 className="size-4" /> {t.region.change}
            </button>
          </div>
          <PlacePicker country={country} onDone={close} />
        </>
      )}
    </Sheet>
  );
}

/** GPS + areas (featured countries) or default city + city search (everywhere else). */
function PlacePicker({ country, onDone }: { country: string; onDone: () => void }) {
  const { t, l, locale } = useI18n();
  const loc = useStore((s) => s.location);
  const setLocation = useStore((s) => s.setLocation);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const gps = () => {
    if (!navigator.geolocation) return setErr(t.nearby.gpsDenied);
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        await applyGpsFix(p.coords.latitude, p.coords.longitude);
        setBusy(false);
        onDone();
      },
      () => {
        setBusy(false);
        setErr(t.nearby.gpsDenied);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  const pick = (x: UserLocation) => {
    setLocation(x);
    onDone();
  };

  const areas = areasIn(country);
  const regions = regionsIn(country);
  const groups: { id: string; title?: string; items: Area[] }[] = regions.length
    ? regions.map((g) => ({ id: g.id, title: l(g.name), items: areas.filter((a) => a.region === g.id) }))
    : [{ id: "all", items: areas }];

  return (
    <>
      <button type="button" onClick={gps} disabled={busy} className="btn btn-primary mb-2 w-full">
        <Crosshair className={cx("size-5", busy && "animate-spin")} /> {t.nearby.useGps}
      </button>
      {err && <p className="mb-2 text-sm font-semibold text-chili">{err}</p>}
      {isFeatured(country) && areas.length ? (
        <div className="mt-4 space-y-4">
          {groups.map((g) => (
            <div key={g.id}>
              {g.title && <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-soft">{g.title}</h3>}
              <div className="flex flex-wrap gap-2">
                {g.items.map((a) => (
                  <button key={a.id} type="button" className="chip" aria-pressed={loc.kind === "area" && loc.areaId === a.id} onClick={() => pick({ kind: "area", areaId: a.id })}>
                    {l(a.name)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <CitySearch country={country} locale={locale} current={loc} onPick={pick} />
      )}
    </>
  );
}

function CitySearch({ country, locale, current, onPick }: { country: string; locale: "ar" | "en"; current: UserLocation; onPick: (x: UserLocation) => void }) {
  const { t, l } = useI18n();
  const [q, setQ] = useState("");
  const [state, setState] = useState<{ status: "idle" | "busy" | "done" | "error"; hits: CityHit[] }>({ status: "idle", hits: [] });
  const def = defaultCity(country);
  const isCurrent = (lat: number, lng: number) => current.kind === "city" && Math.abs(current.lat - lat) < 1e-4 && Math.abs(current.lng - lng) < 1e-4;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setState({ status: "busy", hits: [] });
    searchCity(q, country, locale).then(
      (hits) => setState({ status: "done", hits }),
      () => setState({ status: "error", hits: [] }),
    );
  };

  return (
    <div className="mt-4 space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wide text-ink-soft">{t.region.city}</h3>
      <button type="button" className="chip" aria-pressed={isCurrent(def.lat, def.lng)} onClick={() => onPick({ kind: "city", country, ...def })}>
        {l(def.name)}
      </button>
      <form onSubmit={submit} className="flex gap-2" role="search">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.region.searchCity} className="input min-w-0 flex-1" aria-label={t.region.searchCity} enterKeyHint="search" />
        <button type="submit" className="btn btn-light shrink-0" disabled={state.status === "busy"} aria-label={t.region.search}>
          <Search className="size-4" />
        </button>
      </form>
      {state.status === "busy" && <p className="text-sm text-ink-soft">{t.region.searching}</p>}
      {state.status === "error" && <p className="text-sm font-semibold text-chili">{t.region.searchError}</p>}
      {state.status === "done" && !state.hits.length && <p className="text-sm text-ink-soft">{t.region.noResults}</p>}
      {state.hits.length > 0 && (
        <ul className="divide-y-2 divide-ink/10 rounded-2xl border-2 border-ink bg-white">
          {state.hits.map((h) => (
            <li key={`${h.lat},${h.lng}`}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-start hover:bg-rice"
                onClick={() => onPick({ kind: "city", country, name: { ar: h.name, en: h.name }, lat: h.lat, lng: h.lng })}
              >
                <span className="min-w-0">
                  <span className="block truncate font-bold">{h.name}</span>
                  {h.detail && <span className="block truncate text-xs text-ink-soft">{h.detail}</span>}
                </span>
                <ArrowRight className="size-4 shrink-0 rtl:rotate-180" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-ink-soft">{t.region.searchCredit}</p>
    </div>
  );
}

function CountryList({ onPick }: { onPick: (cc: string) => void }) {
  const { t, locale } = useI18n();
  const current = useStore((s) => s.country);
  const [q, setQ] = useState("");
  const all = useMemo(() => {
    const coll = new Intl.Collator(locale);
    return COUNTRY_CODES.map((cc) => ({ cc, name: countryName(cc, locale), alt: countryName(cc, locale === "ar" ? "en" : "ar") })).sort((a, b) => coll.compare(a.name, b.name));
  }, [locale]);
  const nq = norm(q);
  const match = (c: (typeof all)[number]) => !nq || norm(c.name).includes(nq) || norm(c.alt).includes(nq) || c.cc.toLowerCase() === nq;
  const featured = FEATURED_COUNTRIES.map((cc) => all.find((c) => c.cc === cc)!).filter(match);
  const rest = all.filter((c) => !isFeatured(c.cc) && match(c));
  const row = (c: (typeof all)[number]) => (
    <li key={c.cc}>
      <button type="button" onClick={() => onPick(c.cc)} aria-pressed={c.cc === current} className={cx("flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start font-semibold hover:bg-rice", c.cc === current && "bg-sun/40")}>
        <span className="text-xl" aria-hidden>{flag(c.cc)}</span>
        <span className="min-w-0 flex-1 truncate">{c.name}</span>
      </button>
    </li>
  );
  return (
    <div>
      <div className="relative mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.region.searchCountry} className="input w-full pe-9" aria-label={t.region.searchCountry} autoFocus />
        {q && (
          <button type="button" className="absolute end-2 top-1/2 -translate-y-1/2 p-1" onClick={() => setQ("")} aria-label={t.common.reset}>
            <X className="size-4" />
          </button>
        )}
      </div>
      {featured.length > 0 && (
        <>
          <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-ink-soft">{t.region.featured}</h3>
          <ul className="mb-3">{featured.map(row)}</ul>
        </>
      )}
      <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-ink-soft">{t.region.all}</h3>
      <ul>{rest.map(row)}</ul>
    </div>
  );
}

/** One-time suggestion when the device's time zone points to another country than the selected one. */
export function RegionHint() {
  const mounted = useMounted();
  const hint = useStore((s) => s.regionHint);
  const country = useStore((s) => s.country);
  const { t, locale } = useI18n();
  const detected = mounted && hint === "pending" ? countryFromDeviceTz() : undefined;
  if (!detected || detected === country) return null;
  const name = countryName(detected, locale);
  return (
    <div className="border-t-2 border-ink bg-sun px-4 py-2 text-sm font-semibold">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center">
        <span>
          <span aria-hidden>{flag(detected)} </span>
          {t.region.hint(name)}
        </span>
        <span className="flex gap-2">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => useStore.getState().setCountry(detected)}>
            {t.region.switchTo}
          </button>
          <button type="button" className="btn btn-light btn-sm" onClick={() => useStore.getState().dismissRegionHint()}>
            {t.region.stay}
          </button>
        </span>
      </div>
    </div>
  );
}
