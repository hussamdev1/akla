"use client";
import { useState } from "react";
import { Crosshair, MapPin } from "lucide-react";
import { AREAS, GOVERNORATES, areaById } from "@/data/geo";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { cx, Sheet } from "../ui";

export function useLocationLabel() {
  const loc = useStore((s) => s.location);
  const { l, locale } = useI18n();
  if (loc.kind === "gps") return locale === "ar" ? "موقعي الحالي" : "My location";
  const a = areaById(loc.areaId);
  return a ? l(a.name) : "";
}

export function LocationPill({ className, dark }: { className?: string; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const label = useLocationLabel();
  const { t } = useI18n();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cx("inline-flex max-w-[11rem] items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1.5 text-sm font-bold", dark ? "bg-ink text-white" : "bg-white", className)}
        aria-label={t.header.location}
      >
        <MapPin className="size-4 shrink-0 text-brand" />
        <span className="truncate" suppressHydrationWarning>
          {label}
        </span>
      </button>
      <LocationSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function LocationSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, l } = useI18n();
  const loc = useStore((s) => s.location);
  const setLocation = useStore((s) => s.setLocation);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const gps = () => {
    if (!navigator.geolocation) return setErr(t.nearby.gpsDenied);
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setBusy(false);
        setLocation({ kind: "gps", lat: p.coords.latitude, lng: p.coords.longitude });
        onClose();
      },
      () => {
        setBusy(false);
        setErr(t.nearby.gpsDenied);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  return (
    <Sheet open={open} onClose={onClose} title={t.nearby.pickArea}>
      <button type="button" onClick={gps} disabled={busy} className="btn btn-primary mb-2 w-full">
        <Crosshair className={cx("size-5", busy && "animate-spin")} /> {t.nearby.useGps}
      </button>
      {err && <p className="mb-2 text-sm font-semibold text-chili">{err}</p>}
      <div className="mt-4 space-y-4">
        {GOVERNORATES.map((g) => (
          <div key={g.id}>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-soft">{l(g.name)}</h3>
            <div className="flex flex-wrap gap-2">
              {AREAS.filter((a) => a.governorate === g.id).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="chip"
                  aria-pressed={loc.kind === "area" && loc.areaId === a.id}
                  onClick={() => {
                    setLocation({ kind: "area", areaId: a.id });
                    onClose();
                  }}
                >
                  {l(a.name)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}
