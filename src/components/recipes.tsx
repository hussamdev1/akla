"use client";
import Link from "next/link";
import { Clock, Leaf } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { COURSE_EMOJI, cuisineById, formatMinutes, recipeName, type Course, type CuisineId, type RecipeSummary } from "@/lib/recipes";
import type { CategoryId } from "@/lib/types";
import { RECIPE_CUISINES, RECIPE_INDEX } from "@/data/recipeIndex";
import { cx, FavButton, FoodImage } from "./ui";

export function RecipeMeta({ r, className }: { r: Pick<RecipeSummary, "minutes" | "difficulty" | "veg">; className?: string }) {
  const { t, locale } = useI18n();
  return (
    <div className={cx("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-ink-soft", className)}>
      {r.minutes !== undefined && (
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" /> {formatMinutes(r.minutes, locale)}
        </span>
      )}
      <span className="inline-flex items-center gap-1">
        <span className="flex gap-0.5" aria-hidden>
          {[1, 2, 3].map((i) => (
            <span key={i} className={cx("size-1.5 rounded-full", i <= r.difficulty ? "bg-ink" : "bg-ink/20")} />
          ))}
        </span>
        {t.recipes.difficulty[r.difficulty]}
      </span>
      {r.veg && (
        <span className="inline-flex items-center gap-1 text-emerald-800">
          <Leaf className="size-3.5" /> {t.recipes.veg}
        </span>
      )}
    </div>
  );
}

export function RecipeCard({ r, className }: { r: RecipeSummary; className?: string }) {
  const { l, locale } = useI18n();
  const c = cuisineById(r.cuisine);
  const name = recipeName(r.name, locale);
  return (
    <Link href={`/recipes/${r.id}/`} className={cx("sticker group flex h-full flex-col overflow-hidden text-start transition-shadow hover:shadow-[6px_6px_0_#2B1B3D]", className)}>
      <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-ink">
        <FoodImage src={r.image} emoji={COURSE_EMOJI[r.course]} alt={name} color={c?.color} cors className="size-full transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
          {c && (
            <span className="inline-flex min-w-0 items-center gap-1 rounded-full border-2 border-ink bg-white px-2 py-0.5 text-xs font-extrabold">
              <span aria-hidden>{c.flag}</span> <span className="truncate">{l(c.name)}</span>
            </span>
          )}
          <FavButton kind="recipes" id={r.id} size="sm" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug" lang={locale === "ar" && !r.name.ar ? "en" : undefined}>
          {name}
        </h3>
        <RecipeMeta r={r} className="mt-auto" />
      </div>
    </Link>
  );
}

/** Small row used in search results. */
export function RecipeRow({ r, onClick }: { r: RecipeSummary; onClick?: () => void }) {
  const { l, locale } = useI18n();
  const c = cuisineById(r.cuisine);
  return (
    <Link href={`/recipes/${r.id}/`} onClick={onClick} className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-white p-2 hover:bg-rice-deep">
      <FoodImage src={r.image} emoji={COURSE_EMOJI[r.course]} alt="" size="small" cors color={c?.color} className="size-12 shrink-0 rounded-xl border-2 border-ink" />
      <div className="min-w-0">
        <div className="truncate font-bold">{recipeName(r.name, locale)}</div>
        <div className="truncate text-sm text-ink-soft">
          {c?.flag} {c && l(c.name)}
        </div>
      </div>
    </Link>
  );
}

/* ---------- "Cook it at home" (home page, Discover) ---------- */

type Match = { cuisines?: CuisineId[]; course?: Course; q?: RegExp; veg?: boolean; href: string };
const ARAB: CuisineId[] = ["syrian", "lebanese", "palestinian", "gulf", "yemeni", "egyptian"];
/** Food categories → the recipes that fit them. Categories not listed show the general mix. */
const FOR_CATEGORY: Partial<Record<CategoryId, Match>> = {
  arabic: { cuisines: ARAB, href: "/recipes/?cuisine=syrian" },
  shawarma: { q: /shawarma/i, href: "/recipes/?q=shawarma" },
  grilled: { q: /kebab|kefta|kofta|tandoori|shawarma|grill/i, href: "/recipes/?q=kebab" },
  indian: { cuisines: ["indian"], href: "/recipes/?cuisine=indian" },
  italian: { cuisines: ["italian"], href: "/recipes/?cuisine=italian" },
  pasta: { q: /spaghetti|penne|linguine|fettuccine|lasagn|macaroni|pasta/i, href: "/recipes/?q=pasta" },
  pizza: { q: /pizza/i, href: "/recipes/?q=pizza" },
  asian: { cuisines: ["chinese", "thai", "japanese"], href: "/recipes/?cuisine=chinese" },
  japanese: { cuisines: ["japanese"], href: "/recipes/?cuisine=japanese" },
  sushi: { cuisines: ["japanese"], href: "/recipes/?cuisine=japanese" },
  mexican: { cuisines: ["mexican"], href: "/recipes/?cuisine=mexican" },
  seafood: { q: /fish|prawn|shrimp|tuna|sayyadieh/i, href: "/recipes/?q=fish" },
  desserts: { course: "dessert", href: "/recipes/?course=dessert" },
  breakfast: { course: "breakfast", href: "/recipes/?course=breakfast" },
  salads: { course: "salad", href: "/recipes/?course=salad" },
  healthy: { veg: true, course: "salad", href: "/recipes/?course=salad" },
};
const FEATURED = ["kabsa", "koshari", "maqluba", "chicken-mandi", "fattoush", "lamb-biryani", "mulukhiyah", "pad-thai"];

export function CookAtHome({ category, className }: { category?: CategoryId | null; className?: string }) {
  const { t, l } = useI18n();
  const m = category ? FOR_CATEGORY[category] : undefined;
  const list = m
    ? RECIPE_INDEX.filter((r) => (!m.cuisines || m.cuisines.includes(r.cuisine)) && (!m.course || r.course === m.course) && (!m.q || m.q.test(`${r.id} ${r.name.en}`)) && (!m.veg || r.veg))
    : FEATURED.map((id) => RECIPE_INDEX.find((r) => r.id === id)).filter((r): r is RecipeSummary => !!r);
  if (!list.length) return null;
  return (
    <section className={className} aria-labelledby="cook-at-home">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-48 flex-1">
          <h2 id="cook-at-home" className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            <span className="me-2 inline-block animate-wiggle">👩‍🍳</span>
            {m ? t.recipes.cookAtHome : t.recipes.home}
          </h2>
          <p className="mt-1 text-ink-soft">{t.recipes.homeSub(RECIPE_CUISINES.length)}</p>
        </div>
        <Link href={m?.href ?? "/recipes/"} className="btn btn-light btn-sm shrink-0">
          {t.common.seeAll} <span className="rtl:rotate-180">→</span>
        </Link>
      </div>
      {!m && (
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          {RECIPE_CUISINES.map((c) => (
            <Link key={c.id} href={`/recipes/?cuisine=${c.id}`} className="chip shrink-0" style={{ background: c.color }}>
              <span aria-hidden>{c.flag}</span> {l(c.name)}
            </Link>
          ))}
        </div>
      )}
      <div className="grid gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
        {list.slice(0, 4).map((r) => (
          <RecipeCard key={r.id} r={r} />
        ))}
      </div>
    </section>
  );
}
