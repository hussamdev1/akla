import type { Category, CategoryId } from "@/lib/types";
import { mdb } from "@/lib/img";

export const CATEGORIES: Category[] = [
  { id: "burgers", name: { ar: "برجر", en: "Burgers" }, emoji: "🍔", color: "#FFE3C9", ink: "#E63462", image: mdb("44bzep1761848278") },
  { id: "pizza", name: { ar: "بيتزا", en: "Pizza" }, emoji: "🍕", color: "#FFD9DC", ink: "#F2542D", image: mdb("x0lk931587671540") },
  { id: "fried-chicken", name: { ar: "دجاج مقلي", en: "Fried Chicken" }, emoji: "🍗", color: "#FFEFC2", ink: "#E8A100", image: mdb("tyywsw1505930373") },
  { id: "grilled", name: { ar: "مشاوي", en: "Grilled" }, emoji: "🔥", color: "#FFE0D1", ink: "#E2541B", image: mdb("3um6il1763794322") },
  { id: "bbq", name: { ar: "باربكيو", en: "BBQ" }, emoji: "🍖", color: "#F3D9CF", ink: "#B5432A", image: mdb("kgfh3q1763075438") },
  { id: "sandwiches", name: { ar: "سندويشات", en: "Sandwiches" }, emoji: "🥪", color: "#E9F7D9", ink: "#5FA324", image: mdb("sonirb1763782831") },
  { id: "shawarma", name: { ar: "شاورما", en: "Shawarma" }, emoji: "🌯", color: "#FFF0D6", ink: "#D98200", image: mdb("hcg6l91763596970") },
  { id: "arabic", name: { ar: "أكل عربي", en: "Arabic Food" }, emoji: "🫓", color: "#F6E7D2", ink: "#A8661B", image: mdb("utqnjv1763598650") },
  { id: "indian", name: { ar: "هندي", en: "Indian" }, emoji: "🍛", color: "#FFE6B8", ink: "#D97706", image: mdb("xrttsx1487339558") },
  { id: "italian", name: { ar: "إيطالي", en: "Italian" }, emoji: "🫒", color: "#E3F5E8", ink: "#16A34A", image: mdb("sutysw1468247559") },
  { id: "asian", name: { ar: "آسيوي", en: "Asian" }, emoji: "🥡", color: "#FFE1E1", ink: "#DC2626", image: mdb("rg9ze01763479093") },
  { id: "japanese", name: { ar: "ياباني", en: "Japanese" }, emoji: "🍜", color: "#FCE7F3", ink: "#DB2777", image: mdb("wrustq1511475474") },
  { id: "sushi", name: { ar: "سوشي", en: "Sushi" }, emoji: "🍣", color: "#FFE4E6", ink: "#E11D48", image: mdb("g046bb1663960946") },
  { id: "seafood", name: { ar: "مأكولات بحرية", en: "Seafood" }, emoji: "🦐", color: "#DDF1FF", ink: "#0284C7", image: mdb("ze8uwg1763196123") },
  { id: "mexican", name: { ar: "مكسيكي", en: "Mexican" }, emoji: "🌮", color: "#FFF3C4", ink: "#CA8A04", image: mdb("uvuyxu1503067369") },
  { id: "healthy", name: { ar: "صحي", en: "Healthy" }, emoji: "🥗", color: "#D9FBEF", ink: "#0F9F75", image: mdb("k29viq1585565980") },
  { id: "salads", name: { ar: "سلطات", en: "Salads" }, emoji: "🥬", color: "#E6F9D5", ink: "#4D9A1A", image: mdb("02s6gc1763799560") },
  { id: "pasta", name: { ar: "باستا", en: "Pasta" }, emoji: "🍝", color: "#FFF1CC", ink: "#C27C0E", image: mdb("llcbn01574260722") },
  { id: "desserts", name: { ar: "حلويات", en: "Desserts" }, emoji: "🍰", color: "#F3E8FF", ink: "#9333EA", image: mdb("76nffj1763593933") },
  { id: "ice-cream", name: { ar: "آيس كريم", en: "Ice Cream" }, emoji: "🍦", color: "#E0F2FE", ink: "#0E8C99" },
  { id: "coffee", name: { ar: "قهوة", en: "Coffee" }, emoji: "☕", color: "#EFE3D3", ink: "#7C4A1E" },
  { id: "breakfast", name: { ar: "فطور", en: "Breakfast" }, emoji: "🍳", color: "#FFF7CC", ink: "#D4A000", image: mdb("g373701551450225") },
  { id: "beverages", name: { ar: "مشروبات", en: "Beverages" }, emoji: "🧃", color: "#D7FAF0", ink: "#14B8A6" },
];

export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;
