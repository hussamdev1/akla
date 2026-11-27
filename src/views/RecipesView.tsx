"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Leaf, Search, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { norm } from "@/lib/search";
import { COURSE_EMOJI, COURSES, cuisineById, type Course, type CuisineId } from "@/lib/recipes";
import { RECIPE_CUISINES, RECIPE_INDEX } from "@/data/recipeIndex";
import { QueryParam } from "@/components/QueryParam";
import { RecipeCard } from "@/components/recipes";
import { Container, cx, EmptyState, PageHero, Reveal } from "@/components/ui";

type Time = "any" | "quick" | "hour";
const isCuisine = (v: string | null): v is CuisineId => !!v && !!cuisineById(v);
const isCourse = (v: string | null): v is Course => !!v && (COURSES as string[]).includes(v);

/** Keep the chosen cuisine in the address so the page can be shared or reopened. */
function syncUrl(cuisine: CuisineId | null) {
  const u = new URL(window.location.href);
  if (cuisine) u.searchParams.set("cuisine", cuisine);
  else u.searchParams.delete("cuisine");
  window.history.replaceState(window.history.state, "", u);
}

export function RecipesView() {
  const { t, l, locale } = useI18n();
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState<CuisineId | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [time, setTime] = useState<Time>("any");
  const [level, setLevel] = useState<0 | 1 | 2 | 3>(0);
  const [veg, setVeg] = useState(false);

  const onCuisine = useCallback((v: string | null) => setCuisine(isCuisine(v) ? v : null), []);
  const onCourse = useCallback((v: string | null) => {
    if (isCourse(v)) setCourse(v);
  }, []);
  const onQ = useCallback((v: string | null) => {
    if (v) setQ(v);
  }, []);
  const pickCuisine = (c: CuisineId | null) => {
    setCuisine(c);
    syncUrl(c);
  };

  // a deep link (?cuisine=…) can pick a chip that is off-screen in the scrolling row
  useEffect(() => {
    if (cuisine) document.querySelector(`[data-cuisine="${cuisine}"]`)?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [cuisine]);

  const searchable = useMemo(() => RECIPE_INDEX.map((r) => ({ r, s: norm(`${r.name.en} ${r.name.ar ?? ""} ${r.keys}`) })), []);
  const filtering = !!(q.trim() || cuisine || course || time !== "any" || level || veg);
  const results = useMemo(() => {
    const nq = norm(q);
    return searchable
      .filter(({ r, s }) => {
        if (nq && !s.includes(nq)) return false;
        if (cuisine && r.cuisine !== cuisine) return false;
        if (course && r.course !== course) return false;
        if (time !== "any" && (r.minutes === undefined || r.minutes > (time === "quick" ? 30 : 60))) return false;
        if (level && r.difficulty !== level) return false;
        if (veg && !r.veg) return false;
        return true;
      })
      .map(({ r }) => r);
  }, [searchable, q, cuisine, course, time, level, veg]);
  const clear = () => {
    setQ("");
    pickCuisine(null);
    setCourse(null);
    setTime("any");
    setLevel(0);
    setVeg(false);
  };
  const courseCounts = useMemo(() => Object.fromEntries(COURSES.map((c) => [c, RECIPE_INDEX.filter((r) => r.course === c).length])), []);

  return (
    <>
      <QueryParam name="cuisine" onValue={onCuisine} />
      <QueryParam name="course" onValue={onCourse} />
      <QueryParam name="q" onValue={onQ} />
      <PageHero title={t.recipes.title} subtitle={t.recipes.subtitle} emoji="👩‍🍳" color="#9BE15D">
        <label className="relative block max-w-xl">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-ink-soft" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.recipes.searchPh} className="input pe-10 ps-11 text-base" type="search" enterKeyHint="search" aria-label={t.recipes.searchPh} />
          {q && (
            <button type="button" onClick={() => setQ("")} className="hit absolute end-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-ink/10" aria-label={t.common.clear}>
              <X className="size-4" />
            </button>
          )}
        </label>
      </PageHero>

      <Container className="py-6 sm:py-8">
        {/* Cuisines */}
        <h2 className="sr-only">{t.recipes.cuisines}</h2>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          <button type="button" className="chip shrink-0 !py-2" aria-pressed={!cuisine} onClick={() => pickCuisine(null)}>
            🌍 {t.recipes.allCuisines}
          </button>
          {RECIPE_CUISINES.map((c) => (
            <button key={c.id} type="button" data-cuisine={c.id} className="chip shrink-0 !py-2" aria-pressed={cuisine === c.id} onClick={() => pickCuisine(cuisine === c.id ? null : c.id)} style={cuisine === c.id ? undefined : { background: c.color }}>
              <span aria-hidden>{c.flag}</span> {l(c.name)} <span className="text-xs opacity-60">{c.count}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="mt-3 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          <button type="button" className="chip shrink-0" aria-pressed={!course} onClick={() => setCourse(null)}>
            {t.recipes.anyCourse}
          </button>
          {COURSES.filter((c) => courseCounts[c]).map((c) => (
            <button key={c} type="button" className="chip shrink-0" aria-pressed={course === c} onClick={() => setCourse(course === c ? null : c)}>
              {COURSE_EMOJI[c]} {t.recipes.courses[c]}
            </button>
          ))}
        </div>
        <div className="mt-1 -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          {(["any", "quick", "hour"] as Time[]).map((x) => (
            <button key={x} type="button" className="chip shrink-0 !text-xs" aria-pressed={time === x} onClick={() => setTime(x)}>
              {x === "any" ? "⏱️ " : ""}
              {t.recipes.time[x]}
            </button>
          ))}
          <span className="mx-1 h-5 w-0.5 shrink-0 rounded bg-ink/15" aria-hidden />
          {([0, 1, 2, 3] as const).map((x) => (
            <button key={x} type="button" className="chip shrink-0 !text-xs" aria-pressed={level === x} onClick={() => setLevel(x)}>
              {x ? t.recipes.difficulty[x] : t.recipes.anyDifficulty}
            </button>
          ))}
          <span className="mx-1 h-5 w-0.5 shrink-0 rounded bg-ink/15" aria-hidden />
          <button type="button" className="chip shrink-0 !text-xs" aria-pressed={veg} onClick={() => setVeg(!veg)}>
            <Leaf className="size-3.5" /> {t.recipes.veg}
          </button>
        </div>

        <div className="mb-5 mt-3 flex flex-wrap items-center justify-between gap-2" aria-live="polite">
          <p className="font-bold text-ink-soft">{t.recipes.count(results.length)}</p>
          {filtering && (
            <button type="button" onClick={clear} className="btn btn-light btn-sm">
              <X className="size-4" /> {t.recipes.clear}
            </button>
          )}
        </div>

        {!results.length ? (
          <EmptyState title={t.recipes.empty} action={<button type="button" className="btn btn-primary" onClick={clear}>{t.recipes.clear}</button>} />
        ) : filtering ? (
          <div className="grid gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((r) => (
              <RecipeCard key={r.id} r={r} />
            ))}
          </div>
        ) : (
          // Nothing chosen yet: browse cuisine by cuisine
          <div className="space-y-10">
            {RECIPE_CUISINES.map((c) => {
              const list = results.filter((r) => r.cuisine === c.id);
              return (
                <section key={c.id} aria-labelledby={`cuisine-${c.id}`}>
                  <Reveal>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                      <h2 id={`cuisine-${c.id}`} className="flex items-center gap-2 font-display text-2xl font-extrabold sm:text-3xl">
                        <span className="grid size-11 place-items-center rounded-2xl border-2 border-ink text-2xl" style={{ background: c.color }} aria-hidden>
                          {c.flag}
                        </span>
                        {l(c.name)}
                      </h2>
                      {list.length > 4 && (
                        <button type="button" onClick={() => pickCuisine(c.id)} className="btn btn-light btn-sm">
                          {t.common.seeAll} ({list.length}) <span className="rtl:rotate-180">→</span>
                        </button>
                      )}
                    </div>
                  </Reveal>
                  <div className={cx("grid gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4")}>
                    {list.slice(0, 4).map((r) => (
                      <RecipeCard key={r.id} r={r} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
        <p className="mt-10 text-center text-xs text-ink-soft" lang={locale}>
          {t.recipes.timeNote}
        </p>
      </Container>
    </>
  );
}
