"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";

export type MapMarker = { id: string; lat: number; lng: number; emoji: string; color: string; label: string; kind?: "demo" | "osm" };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

type Ctx = { L: typeof Leaflet; map: Leaflet.Map; layer: Leaflet.LayerGroup };

export function MapView({
  center,
  zoom = 13,
  markers,
  user,
  radiusKm,
  selected,
  onSelect,
  className = "h-80",
  interactive = true,
}: {
  center: { lat: number; lng: number };
  zoom?: number;
  markers: MapMarker[];
  user?: { lat: number; lng: number };
  radiusKm?: number;
  selected?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
  interactive?: boolean;
}) {
  const el = useRef<HTMLDivElement>(null);
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const onSelectRef = useRef(onSelect);
  const initial = useRef({ center, zoom, interactive });

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Create the map once (Leaflet needs `window`, so it is imported lazily).
  useEffect(() => {
    let cancelled = false;
    let map: Leaflet.Map | null = null;
    void import("leaflet").then((mod) => {
      if (cancelled || !el.current) return;
      const L = (mod as unknown as { default?: typeof Leaflet }).default ?? (mod as unknown as typeof Leaflet);
      const { center: c, zoom: z, interactive: i } = initial.current;
      map = L.map(el.current, { center: [c.lat, c.lng], zoom: z, zoomControl: i, scrollWheelZoom: false, dragging: i });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        crossOrigin: true, // CORS tiles can go in the service worker's small offline tile cache
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      setCtx({ L, map, layer: L.layerGroup().addTo(map) });
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, []);

  // Draw markers whenever data changes.
  useEffect(() => {
    if (!ctx) return;
    const { L, layer } = ctx;
    layer.clearLayers();
    if (user) {
      if (radiusKm) L.circle([user.lat, user.lng], { radius: radiusKm * 1000, color: "#0E8C99", weight: 2, fillOpacity: 0.06, dashArray: "6 6" }).addTo(layer);
      L.marker([user.lat, user.lng], {
        icon: L.divIcon({ className: "akla-pin", html: `<div style="width:22px;height:22px;border-radius:50%;background:#0E8C99;border:3px solid white;box-shadow:0 0 0 3px #0E8C9955"></div>`, iconSize: [22, 22], iconAnchor: [11, 11] }),
        zIndexOffset: 1000,
      }).addTo(layer);
    }
    for (const m of markers) {
      const isSel = m.id === selected;
      const size = m.kind === "osm" ? 30 : isSel ? 48 : 40;
      const html =
        m.kind === "osm"
          ? `<div style="width:${size}px;height:${size}px;border-radius:50%;background:white;border:2px solid #2B1B3D;display:grid;place-items:center;font-size:15px;box-shadow:2px 2px 0 #2B1B3D">${m.emoji}</div>`
          : `<div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);background:${m.color};border:2.5px solid #2B1B3D;box-shadow:3px 3px 0 #2B1B3D;display:grid;place-items:center"><span style="transform:rotate(45deg);font-size:${isSel ? 24 : 20}px">${m.emoji}</span></div>`;
      L.marker([m.lat, m.lng], {
        icon: L.divIcon({ className: "akla-pin", html, iconSize: [size, size], iconAnchor: m.kind === "osm" ? [size / 2, size / 2] : [size / 2, size] }),
        zIndexOffset: isSel ? 900 : m.kind === "osm" ? 0 : 100,
        keyboard: true,
        title: esc(m.label),
        alt: m.label,
      })
        .on("click", () => onSelectRef.current?.(m.id))
        .addTo(layer);
    }
  }, [ctx, markers, user, radiusKm, selected]);

  // Smoothly follow location / radius changes.
  useEffect(() => {
    ctx?.map.flyTo([center.lat, center.lng], zoom, { duration: 0.8 });
  }, [ctx, center.lat, center.lng, zoom]);

  return <div ref={el} className={`relative z-0 overflow-hidden rounded-[1.25rem] border-2 border-ink ${className}`} />;
}
