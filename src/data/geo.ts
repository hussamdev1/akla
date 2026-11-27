import type { Area, L } from "@/lib/types";

/** Featured countries: build-time OpenStreetMap snapshots and curated areas. Everything else is live. */
export const FEATURED_COUNTRIES = ["KW", "SA", "AE", "QA", "BH", "OM"] as const;

/** Optional grouping of areas inside a country (Kuwait's governorates). */
export const REGIONS: { id: string; country: string; name: L }[] = [
  { id: "capital", country: "KW", name: { ar: "العاصمة", en: "Capital" } },
  { id: "hawalli", country: "KW", name: { ar: "حولي", en: "Hawalli" } },
  { id: "farwaniya", country: "KW", name: { ar: "الفروانية", en: "Farwaniya" } },
  { id: "mubarak", country: "KW", name: { ar: "مبارك الكبير", en: "Mubarak Al-Kabeer" } },
  { id: "ahmadi", country: "KW", name: { ar: "الأحمدي", en: "Ahmadi" } },
  { id: "jahra", country: "KW", name: { ar: "الجهراء", en: "Jahra" } },
];

const a = (id: string, country: string, ar: string, en: string, lat: number, lng: number, region?: string): Area => ({ id, country, region, name: { ar, en }, lat, lng });

// Approximate area / city centres (public geography). Used for distance estimates and the map centre only.
export const AREAS: Area[] = [
  // Kuwait — ids predate multi-country support and stay unprefixed (they're stored in users' settings).
  a("kuwait-city", "KW", "مدينة الكويت", "Kuwait City", 29.3759, 47.9774, "capital"),
  a("sharq", "KW", "شرق", "Sharq", 29.3858, 47.9946, "capital"),
  a("shuwaikh", "KW", "الشويخ", "Shuwaikh", 29.3456, 47.9389, "capital"),
  a("salmiya", "KW", "السالمية", "Salmiya", 29.3339, 48.0758, "hawalli"),
  a("hawalli", "KW", "حولي", "Hawalli", 29.3328, 48.0286, "hawalli"),
  a("jabriya", "KW", "الجابرية", "Jabriya", 29.3156, 48.0294, "hawalli"),
  a("salwa", "KW", "سلوى", "Salwa", 29.2958, 48.0786, "hawalli"),
  a("farwaniya", "KW", "الفروانية", "Farwaniya", 29.2775, 47.9586, "farwaniya"),
  a("khaitan", "KW", "خيطان", "Khaitan", 29.2856, 47.9764, "farwaniya"),
  a("sabah-alsalem", "KW", "صباح السالم", "Sabah Al-Salem", 29.2572, 48.0572, "mubarak"),
  a("messila", "KW", "المسيلة", "Messila", 29.2717, 48.0942, "mubarak"),
  a("fahaheel", "KW", "الفحيحيل", "Fahaheel", 29.0825, 48.1303, "ahmadi"),
  a("mangaf", "KW", "المنقف", "Mangaf", 29.0961, 48.1306, "ahmadi"),
  a("ahmadi", "KW", "الأحمدي", "Ahmadi", 29.0769, 48.0839, "ahmadi"),
  a("jahra", "KW", "الجهراء", "Jahra", 29.3375, 47.6581, "jahra"),
  // Saudi Arabia
  a("sa-riyadh", "SA", "الرياض", "Riyadh", 24.7136, 46.6753),
  a("sa-jeddah", "SA", "جدة", "Jeddah", 21.5433, 39.1728),
  a("sa-makkah", "SA", "مكة المكرمة", "Makkah", 21.3891, 39.8579),
  a("sa-madinah", "SA", "المدينة المنورة", "Madinah", 24.5247, 39.5692),
  a("sa-dammam", "SA", "الدمام", "Dammam", 26.4207, 50.0888),
  a("sa-khobar", "SA", "الخبر", "Al Khobar", 26.2172, 50.1971),
  a("sa-taif", "SA", "الطائف", "Taif", 21.2703, 40.4158),
  a("sa-abha", "SA", "أبها", "Abha", 18.2465, 42.5117),
  a("sa-tabuk", "SA", "تبوك", "Tabuk", 28.3835, 36.5662),
  a("sa-buraidah", "SA", "بريدة", "Buraidah", 26.326, 43.975),
  // United Arab Emirates
  a("ae-downtown", "AE", "دبي — وسط المدينة", "Dubai — Downtown", 25.1972, 55.2744),
  a("ae-marina", "AE", "دبي مارينا", "Dubai Marina", 25.0805, 55.1403),
  a("ae-deira", "AE", "ديرة", "Deira", 25.2711, 55.3075),
  a("ae-abu-dhabi", "AE", "أبوظبي", "Abu Dhabi", 24.4539, 54.3773),
  a("ae-sharjah", "AE", "الشارقة", "Sharjah", 25.3463, 55.4209),
  a("ae-ajman", "AE", "عجمان", "Ajman", 25.4052, 55.5136),
  a("ae-al-ain", "AE", "العين", "Al Ain", 24.2075, 55.7447),
  a("ae-rak", "AE", "رأس الخيمة", "Ras Al Khaimah", 25.8007, 55.9762),
  a("ae-fujairah", "AE", "الفجيرة", "Fujairah", 25.1288, 56.3265),
  // Qatar
  a("qa-west-bay", "QA", "الدوحة — الخليج الغربي", "Doha — West Bay", 25.322, 51.53),
  a("qa-al-sadd", "QA", "السد", "Al Sadd", 25.285, 51.495),
  a("qa-pearl", "QA", "اللؤلؤة", "The Pearl", 25.37, 51.55),
  a("qa-lusail", "QA", "لوسيل", "Lusail", 25.42, 51.49),
  a("qa-al-wakrah", "QA", "الوكرة", "Al Wakrah", 25.1659, 51.5976),
  a("qa-al-rayyan", "QA", "الريان", "Al Rayyan", 25.2919, 51.4244),
  a("qa-al-khor", "QA", "الخور", "Al Khor", 25.6839, 51.5058),
  // Bahrain
  a("bh-manama", "BH", "المنامة", "Manama", 26.2235, 50.5876),
  a("bh-seef", "BH", "السيف", "Seef", 26.2361, 50.534),
  a("bh-juffair", "BH", "الجفير", "Juffair", 26.21, 50.605),
  a("bh-adliya", "BH", "العدلية", "Adliya", 26.213, 50.585),
  a("bh-muharraq", "BH", "المحرق", "Muharraq", 26.2572, 50.6119),
  a("bh-riffa", "BH", "الرفاع", "Riffa", 26.13, 50.555),
  a("bh-isa-town", "BH", "مدينة عيسى", "Isa Town", 26.1736, 50.5478),
  // Oman
  a("om-qurum", "OM", "مسقط — القرم", "Muscat — Qurum", 23.614, 58.476),
  a("om-al-khuwair", "OM", "الخوير", "Al Khuwair", 23.595, 58.41),
  a("om-mutrah", "OM", "مطرح", "Mutrah", 23.62, 58.565),
  a("om-seeb", "OM", "السيب", "Seeb", 23.67, 58.19),
  a("om-sohar", "OM", "صحار", "Sohar", 24.347, 56.709),
  a("om-salalah", "OM", "صلالة", "Salalah", 17.0151, 54.0924),
  a("om-nizwa", "OM", "نزوى", "Nizwa", 22.9333, 57.5333),
  a("om-sur", "OM", "صور", "Sur", 22.5667, 59.5289),
];

/** First area of each featured country is not always the best default. */
export const DEFAULT_AREA: Record<string, string> = { KW: "salmiya", SA: "sa-riyadh", AE: "ae-downtown", QA: "qa-west-bay", BH: "bh-manama", OM: "om-qurum" };
export const DEFAULT_AREA_ID = DEFAULT_AREA.KW;

export const areaById = (id: string) => AREAS.find((x) => x.id === id);
export const areasIn = (country: string) => AREAS.filter((x) => x.country === country);
export const regionsIn = (country: string) => REGIONS.filter((r) => r.country === country);

/** Nearest curated area of a country (squared-degree distance is fine at city scale). */
export function nearestArea(lat: number, lng: number, country: string) {
  const list = areasIn(country);
  if (!list.length) return undefined;
  return list.reduce((best, x) => ((x.lat - lat) ** 2 + (x.lng - lng) ** 2 < (best.lat - lat) ** 2 + (best.lng - lng) ** 2 ? x : best));
}

/** Display area of a listing / place: its curated area, else its city name (null-safe for call sites). */
export function areaOf(x: { areaId?: string; city?: string }): { name: L } | undefined {
  const found = x.areaId ? areaById(x.areaId) : undefined;
  if (found) return found;
  return x.city ? { name: { ar: x.city, en: x.city } } : undefined;
}
