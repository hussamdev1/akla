/** TheMealDB image helper. Sizes: small (200px), medium (350px), large (500px), full. */
export const mdb = (id: string) => `https://www.themealdb.com/images/media/meals/${id}.jpg`;

export function sized(url: string | undefined, size: "small" | "medium" | "large" | "full" = "medium") {
  if (!url) return undefined;
  if (size === "full" || !url.includes("themealdb.com")) return url;
  return `${url}/${size}`;
}

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Site-relative paths ("/logos/x.png") get the GitHub Pages base path; full URLs pass through. */
export const assetUrl = (url: string) => (url.startsWith("/") ? `${BASE_PATH}${url}` : url);
