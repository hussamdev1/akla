import type { Area, GovernorateId, L } from "@/lib/types";

export const GOVERNORATES: { id: GovernorateId; name: L }[] = [
  { id: "capital", name: { ar: "العاصمة", en: "Capital" } },
  { id: "hawalli", name: { ar: "حولي", en: "Hawalli" } },
  { id: "farwaniya", name: { ar: "الفروانية", en: "Farwaniya" } },
  { id: "mubarak", name: { ar: "مبارك الكبير", en: "Mubarak Al-Kabeer" } },
  { id: "ahmadi", name: { ar: "الأحمدي", en: "Ahmadi" } },
  { id: "jahra", name: { ar: "الجهراء", en: "Jahra" } },
];

// Approximate area centres (public geography). Used for distance estimates only.
export const AREAS: Area[] = [
  { id: "kuwait-city", name: { ar: "مدينة الكويت", en: "Kuwait City" }, governorate: "capital", lat: 29.3759, lng: 47.9774 },
  { id: "sharq", name: { ar: "شرق", en: "Sharq" }, governorate: "capital", lat: 29.3858, lng: 47.9946 },
  { id: "shuwaikh", name: { ar: "الشويخ", en: "Shuwaikh" }, governorate: "capital", lat: 29.3456, lng: 47.9389 },
  { id: "salmiya", name: { ar: "السالمية", en: "Salmiya" }, governorate: "hawalli", lat: 29.3339, lng: 48.0758 },
  { id: "hawalli", name: { ar: "حولي", en: "Hawalli" }, governorate: "hawalli", lat: 29.3328, lng: 48.0286 },
  { id: "jabriya", name: { ar: "الجابرية", en: "Jabriya" }, governorate: "hawalli", lat: 29.3156, lng: 48.0294 },
  { id: "salwa", name: { ar: "سلوى", en: "Salwa" }, governorate: "hawalli", lat: 29.2958, lng: 48.0786 },
  { id: "farwaniya", name: { ar: "الفروانية", en: "Farwaniya" }, governorate: "farwaniya", lat: 29.2775, lng: 47.9586 },
  { id: "khaitan", name: { ar: "خيطان", en: "Khaitan" }, governorate: "farwaniya", lat: 29.2856, lng: 47.9764 },
  { id: "sabah-alsalem", name: { ar: "صباح السالم", en: "Sabah Al-Salem" }, governorate: "mubarak", lat: 29.2572, lng: 48.0572 },
  { id: "messila", name: { ar: "المسيلة", en: "Messila" }, governorate: "mubarak", lat: 29.2717, lng: 48.0942 },
  { id: "fahaheel", name: { ar: "الفحيحيل", en: "Fahaheel" }, governorate: "ahmadi", lat: 29.0825, lng: 48.1303 },
  { id: "mangaf", name: { ar: "المنقف", en: "Mangaf" }, governorate: "ahmadi", lat: 29.0961, lng: 48.1306 },
  { id: "ahmadi", name: { ar: "الأحمدي", en: "Ahmadi" }, governorate: "ahmadi", lat: 29.0769, lng: 48.0839 },
  { id: "jahra", name: { ar: "الجهراء", en: "Jahra" }, governorate: "jahra", lat: 29.3375, lng: 47.6581 },
];

export const DEFAULT_AREA_ID = "salmiya";

export const areaById = (id: string) => AREAS.find((a) => a.id === id);
