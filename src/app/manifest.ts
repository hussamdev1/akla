import type { MetadataRoute } from "next";
import { BASE_PATH } from "@/lib/img";

// Emitted as out/manifest.webmanifest by the static export. Paths are absolute and carry the
// basePath (/akla on GitHub Pages, empty locally) — Next does not prefix values inside the manifest.
export const dynamic = "force-static";

const p = (path: string) => `${BASE_PATH}${path}`;
const icon192 = { src: p("/icons/icon-192.png"), sizes: "192x192", type: "image/png" };

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: p("/"),
    name: "Akla · أكلة",
    short_name: "أكلة",
    description: "شنو ناكل اليوم؟ اكتشف الأكل والعروض في الكويت · Discover food, deals and fun ways to decide what to eat in Kuwait.",
    lang: "ar",
    dir: "rtl",
    start_url: p("/"),
    scope: p("/"),
    display: "standalone",
    theme_color: "#E63462",
    background_color: "#FFF8EE",
    categories: ["food", "lifestyle", "travel"],
    icons: [
      { ...icon192, purpose: "any" },
      { src: p("/icons/icon-512.png"), sizes: "512x512", type: "image/png", purpose: "any" },
      { src: p("/icons/maskable-192.png"), sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: p("/icons/maskable-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "عجلة الأكل · Food Roulette", short_name: "اختار لي", url: p("/picker/"), icons: [icon192] },
      { name: "العروض · Offers", short_name: "العروض", url: p("/offers/"), icons: [icon192] },
      { name: "القريب مني · Nearby", short_name: "القريب مني", url: p("/nearby/"), icons: [icon192] },
    ],
  };
}
