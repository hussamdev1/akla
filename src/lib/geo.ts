import { areaById, DEFAULT_AREA_ID } from "@/data/geo";
import { defaultCity } from "./region";
import type { UserLocation } from "./types";

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Coordinates of the user's chosen location (falls back to the country's default city, then Salmiya). */
export function locationPoint(loc: UserLocation, country?: string) {
  if (loc.kind === "gps" || loc.kind === "city") return { lat: loc.lat, lng: loc.lng };
  const a = areaById(loc.areaId);
  if (a) return { lat: a.lat, lng: a.lng };
  if (country) {
    const c = defaultCity(country);
    return { lat: c.lat, lng: c.lng };
  }
  const k = areaById(DEFAULT_AREA_ID)!;
  return { lat: k.lat, lng: k.lng };
}

export const directionsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
