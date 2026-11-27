"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChefHat, ChevronLeft, ChevronRight, Clock, Leaf, ListChecks, Minus, Pause, Play, Plus, Share2, Sun, Timer, Users, X, CirclePlay } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { celebrate, sfx } from "@/lib/fx";
import { useMounted } from "@/lib/hooks";
import { amount, COURSE_EMOJI, cuisineById, formatMinutes, stepTimer, usableAr, type Recipe, type RecipeAr } from "@/lib/recipes";
import { RECIPE_INDEX } from "@/data/recipeIndex";
import { RecipeCard } from "@/components/recipes";
import { Container, cx, FavButton, FoodImage, Sheet } from "@/components/ui";

const FACTORS = [0.5, 1, 1.5, 2, 3];
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/* ---------- timer (one at a time, shared by the page and cook mode) ---------- */

type TimerState = { total: number; left: number; running: boolean } | null;

function useTimer() {
  const [timer, setTimer] = useState<TimerState>(null);
  const showToast = useStore((s) => s.showToast);
  const { t } = useI18n();
  const running = !!timer?.running;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTimer((x) => (x && x.running ? { ...x, left: Math.max(0, x.left - 1) } : x)), 1000);
    return () => clearInterval(id);
  }, [running]);
  const done = timer?.running && timer.left === 0;
  useEffect(() => {
    if (!done) return;
    sfx.win();
    navigator.vibrate?.([300, 120, 300]);
    showToast(t.recipes.timeUp, "⏰");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- stop once the countdown reaches zero
    setTimer(null);
  }, [done, showToast, t]);
  return {
    timer,
    start: (secs: number) => setTimer({ total: secs, left: secs, running: true }),
    toggle: () => setTimer((x) => (x ? { ...x, running: !x.running } : x)),
    stop: () => setTimer(null),
  };
}

function TimerPill({ timer, onToggle, onStop, className }: { timer: NonNullable<TimerState>; onToggle: () => void; onStop: () => void; className?: string }) {
  const { t } = useI18n();
  return (
    <div className={cx("inline-flex items-center gap-1 rounded-full border-2 border-ink bg-sun py-1 pe-1 ps-3 font-extrabold shadow-[2px_2px_0_#2B1B3D]", className)} role="timer" aria-live="off">
      <Timer className="size-4" />
      <span dir="ltr" className="min-w-12 text-center tabular-nums">{clock(timer.left)}</span>
      <button type="button" onClick={onToggle} className="hit grid size-8 place-items-center rounded-full bg-white" aria-label={timer.running ? t.recipes.pause : t.recipes.resume}>
        {timer.running ? <Pause className="size-4" /> : <Play className="size-4" />}
      </button>
      <button type="button" onClick={onStop} className="hit grid size-8 place-items-center rounded-full bg-white" aria-label={t.recipes.stop}>
        <X className="size-4" />
      </button>
    </div>
  );
}

/* ---------- keep the screen on while cooking ---------- */

function useWakeLock(on: boolean) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!on || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const get = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
        if (cancelled) return void lock.release();
        setActive(true);
        lock.addEventListener("release", () => setActive(false));
      } catch {
        setActive(false);
      }
    };
    const onVis = () => document.visibilityState === "visible" && get();
    get();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => {});
      setActive(false);
    };
  }, [on]);
  return active;
}

/* ---------- page ---------- */

export function RecipeView({ recipe: r, ar }: { recipe: Recipe; ar?: RecipeAr }) {
  const { t, l, locale, dir } = useI18n();
  const mounted = useMounted();
  const showToast = useStore((s) => s.showToast);
  const a = usableAr(r, ar);
  // Arabic only when a translation of this exact text exists; otherwise English, marked as such.
  const inAr = locale === "ar" && !!a;
  const englishOnly = locale === "ar" && !a;
  const cl = inAr ? "ar" : "en";
  const name = inAr ? a.name : r.name;
  const steps = inAr ? a.steps : r.steps;
  const ingText = (i: number) => (inAr ? a.ingredients[i] : r.ingredients[i].text);
  const c = cuisineById(r.cuisine)!;
  const contentProps = englishOnly ? { lang: "en", dir: "ltr" as const } : {};

  const [servings, setServings] = useState(r.servings ?? 0);
  const [factorIdx, setFactorIdx] = useState(1);
  const factor = r.servings ? servings / r.servings : FACTORS[factorIdx];
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const items = r.ingredients.map((x, i) => ({ ...x, i })).filter((x) => !x.h);
  const toggle = (i: number) =>
    setChecked((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  const [cook, setCook] = useState<number | null>(null);
  const { timer, start, toggle: toggleTimer, stop } = useTimer();
  const timers = useMemo(() => r.steps.map(stepTimer), [r.steps]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else {
        await navigator.clipboard.writeText(url);
        showToast(t.common.copied, "🔗");
      }
    } catch {
      /* cancelled */
    }
  };
  const related = useMemo(() => RECIPE_INDEX.filter((x) => x.cuisine === r.cuisine && x.id !== r.id).slice(0, 4), [r]);

  const ingredientList = (big?: boolean) => (
    <ul className={cx("space-y-1", big && "text-lg")} {...contentProps}>
      {r.ingredients.map((x, i) =>
        x.h ? (
          <li key={i} className="pt-3 font-display text-base font-extrabold first:pt-0">
            {ingText(i)}
          </li>
        ) : (
          <li key={i}>
            <button type="button" role="checkbox" aria-checked={checked.has(i)} onClick={() => toggle(i)} className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-start transition-colors hover:bg-rice">
              <span className={cx("mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 border-ink transition-colors", checked.has(i) ? "bg-lime" : "bg-white")}>
                {checked.has(i) && <Check className="size-4" strokeWidth={3} />}
              </span>
              <span className={cx("min-w-0 flex-1", checked.has(i) && "text-ink-soft line-through")}>
                {x.q !== undefined && <b className="me-1.5 whitespace-nowrap">{amount(x, factor, cl)}</b>}
                {ingText(i)}
              </span>
            </button>
          </li>
        ),
      )}
    </ul>
  );

  return (
    <>
      <Container className="pt-4 sm:pt-6">
        <nav className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink-soft" aria-label="Breadcrumb">
          <Link href="/recipes/" className="inline-flex items-center gap-1 hover:text-brand">
            <ChevronLeft className="size-4 rtl:rotate-180" /> {t.recipes.backAll}
          </Link>
          <span aria-hidden>·</span>
          <Link href={`/recipes/?cuisine=${c.id}`} className="hover:text-brand">
            {c.flag} {l(c.name)}
          </Link>
        </nav>
      </Container>

      {/* Hero */}
      <Container className="grid items-start gap-6 py-5 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-10 md:py-8">
        <div className="sticker relative overflow-hidden md:-rotate-1">
          <FoodImage src={r.image} size="large" emoji={COURSE_EMOJI[r.course]} alt={name} color={c.color} cors eager className={cx("aspect-[4/3] w-full", r.image && "md:aspect-square")} />
          <div className="absolute end-3 top-3">
            <FavButton kind="recipes" id={r.id} />
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Link href={`/recipes/?cuisine=${c.id}`} className="chip" style={{ background: c.color }}>
              <span aria-hidden>{c.flag}</span> {l(c.name)}
            </Link>
            <Link href={`/recipes/?course=${r.course}`} className="chip">
              {COURSE_EMOJI[r.course]} {t.recipes.courses[r.course]}
            </Link>
          </div>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight sm:text-5xl" {...contentProps}>
            {name}
          </h1>
          {inAr && <p className="mt-1 font-semibold text-ink-soft" lang="en" dir="ltr">{r.name}</p>}
          {englishOnly && <p className="mt-3 inline-flex rounded-full bg-sun/40 px-3 py-1 text-sm font-bold text-amber-900">🌐 {t.recipes.englishOnly}</p>}

          <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {r.minutes !== undefined && (
              <div className="rounded-2xl border-2 border-ink bg-white p-3">
                <dt className="flex items-center gap-1 text-xs font-bold text-ink-soft"><Clock className="size-3.5" /> {t.recipes.statTime}</dt>
                <dd className="font-display text-lg font-extrabold">{formatMinutes(r.minutes, locale)}</dd>
              </div>
            )}
            <div className="rounded-2xl border-2 border-ink bg-white p-3">
              <dt className="text-xs font-bold text-ink-soft">{t.recipes.statLevel}</dt>
              <dd className="font-display text-lg font-extrabold">{t.recipes.difficulty[r.difficulty]}</dd>
            </div>
            {r.servings && (
              <div className="rounded-2xl border-2 border-ink bg-white p-3">
                <dt className="flex items-center gap-1 text-xs font-bold text-ink-soft"><Users className="size-3.5" /> {t.recipes.servings}</dt>
                <dd className="font-display text-lg font-extrabold">{t.recipes.people(r.servings)}</dd>
              </div>
            )}
            <div className="rounded-2xl border-2 border-ink bg-white p-3">
              <dt className="flex items-center gap-1 text-xs font-bold text-ink-soft"><ListChecks className="size-3.5" /> {t.recipes.steps}</dt>
              <dd className="font-display text-lg font-extrabold">{steps.length}</dd>
            </div>
          </dl>
          {r.veg && (
            <p className="mt-3 flex items-start gap-2 text-sm font-semibold text-emerald-800">
              <Leaf className="mt-0.5 size-4 shrink-0" /> {t.recipes.vegNote}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setCook(0)} className="btn btn-primary text-lg">
              <ChefHat className="size-5" /> {t.recipes.cook}
            </button>
            <button type="button" onClick={share} className="btn btn-light">
              <Share2 className="size-4" /> {t.common.share}
            </button>
            {r.video && (
              <a href={r.video} target="_blank" rel="noreferrer" className="btn btn-light">
                <CirclePlay className="size-4 text-chili" /> {t.recipes.video}
              </a>
            )}
          </div>
        </div>
      </Container>

      {/* Ingredients + steps */}
      <Container className="grid items-start gap-6 pb-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-10">
        <section className="sticker p-4 sm:p-5 lg:sticky lg:top-24" aria-labelledby="ingredients">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="ingredients" className="font-display text-2xl font-extrabold">🧺 {t.recipes.ingredients}</h2>
            <span className="text-sm font-bold text-ink-soft">{t.recipes.ready(checked.size, items.length)}</span>
          </div>
          {/* Scaler */}
          <div className="mt-3 rounded-2xl bg-rice p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold">{r.servings ? t.recipes.servings : t.recipes.amount}</span>
              {r.servings ? (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setServings(Math.max(1, servings - 1))} disabled={servings <= 1} className="hit grid size-9 place-items-center rounded-full border-2 border-ink bg-white disabled:opacity-40" aria-label="−">
                    <Minus className="size-4" />
                  </button>
                  <span className="min-w-20 text-center font-display text-lg font-extrabold" aria-live="polite">{t.recipes.people(servings)}</span>
                  <button type="button" onClick={() => setServings(Math.min(r.servings! * 4, servings + 1))} className="hit grid size-9 place-items-center rounded-full border-2 border-ink bg-white" aria-label="+">
                    <Plus className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-1" role="radiogroup" aria-label={t.recipes.amount}>
                  {FACTORS.map((f, i) => (
                    <button key={f} type="button" role="radio" aria-checked={factorIdx === i} onClick={() => setFactorIdx(i)} className={cx("min-w-10 rounded-full border-2 border-ink px-2 py-1 text-sm font-extrabold", factorIdx === i ? "bg-ink text-white" : "bg-white")} dir="ltr">
                      ×{f === 0.5 ? "½" : f === 1.5 ? "1½" : f}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-ink-soft">{t.recipes.scaleHint}</p>
          </div>
          <div className="mt-3">{ingredientList()}</div>
          {checked.size > 0 && (
            <button type="button" onClick={() => setChecked(new Set())} className="mt-2 text-sm font-bold text-ink-soft underline">
              {t.recipes.uncheck}
            </button>
          )}
        </section>

        <section aria-labelledby="steps">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="steps" className="font-display text-2xl font-extrabold sm:text-3xl">👩‍🍳 {t.recipes.steps}</h2>
            <button type="button" onClick={() => setCook(0)} className="btn btn-sun btn-sm">
              <ChefHat className="size-4" /> {t.recipes.cookMode}
            </button>
          </div>
          <ol className="space-y-3" {...contentProps}>
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3 rounded-2xl border-2 border-ink bg-white p-3 sm:gap-4 sm:p-4">
                <button type="button" onClick={() => setCook(i)} className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-brand font-display text-lg font-extrabold text-white" aria-label={`${t.recipes.cookMode}: ${t.recipes.stepOf(i + 1, steps.length)}`}>
                  {i + 1}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="leading-relaxed">{s}</p>
                  {timers[i] && (
                    <button type="button" onClick={() => start(timers[i]!)} className="mt-2 inline-flex items-center gap-1 rounded-full border-2 border-ink bg-sun/50 px-3 py-1 text-xs font-extrabold" dir={dir}>
                      <Timer className="size-3.5" /> {t.recipes.timer(formatMinutes(Math.round(timers[i]! / 60), locale))}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {/* Attribution */}
          <div className="mt-6 space-y-1 rounded-2xl bg-ink/5 p-4 text-xs text-ink-soft">
            <p>
              {t.recipes.source}{" "}
              <a href={r.source.url} target="_blank" rel="noreferrer" className="font-bold underline">
                {r.source.kind === "mealdb" ? "TheMealDB" : `Wikibooks Cookbook — ${r.source.title}`}
              </a>
              {r.source.license && (
                <>
                  {" · "}
                  {t.recipes.licence}{" "}
                  <a href={r.source.licenseUrl} target="_blank" rel="noreferrer" className="underline">
                    {r.source.license}
                  </a>
                </>
              )}
            </p>
            {inAr && r.source.license && <p>{t.recipes.translated}</p>}
            {r.imageCredit && (
              <p>
                {t.recipes.photo}{" "}
                <a href={r.imageCredit.url} target="_blank" rel="noreferrer" className="underline">
                  {r.imageCredit.author ?? "Wikimedia Commons"}
                </a>{" "}
                · {r.imageCredit.license}
              </p>
            )}
            {r.minutes !== undefined && <p>{t.recipes.timeNote}</p>}
          </div>
        </section>
      </Container>

      {related.length > 0 && (
        <Container className="py-8">
          <h2 className="mb-4 font-display text-2xl font-extrabold sm:text-3xl">
            {c.flag} {t.recipes.more(l(c.name))}
          </h2>
          <div className="grid gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {related.map((x) => (
              <RecipeCard key={x.id} r={x} />
            ))}
          </div>
        </Container>
      )}

      {timer && cook === null && (
        <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center lg:bottom-6">
          <TimerPill timer={timer} onToggle={toggleTimer} onStop={stop} />
        </div>
      )}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {cook !== null && (
              <CookMode
                key="cook"
                id={r.id}
                name={name}
                steps={steps}
                timers={timers}
                at={cook}
                setAt={setCook}
                onClose={() => setCook(null)}
                ingredients={ingredientList(true)}
                timer={timer}
                startTimer={start}
                toggleTimer={toggleTimer}
                stopTimer={stop}
                contentProps={contentProps}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

/* ---------- cook mode ---------- */

function CookMode(p: {
  id: string;
  name: string;
  steps: string[];
  timers: (number | undefined)[];
  at: number;
  setAt: (n: number) => void;
  onClose: () => void;
  ingredients: React.ReactNode;
  timer: TimerState;
  startTimer: (s: number) => void;
  toggleTimer: () => void;
  stopTimer: () => void;
  contentProps: { lang?: string; dir?: "ltr" };
}) {
  const { t, locale, dir } = useI18n();
  const [showIng, setShowIng] = useState(false);
  const awake = useWakeLock(true);
  const n = p.steps.length;
  const finished = p.at >= n;
  const { setAt, onClose, at } = p;
  const go = useCallback(
    (d: number) => {
      const next = Math.min(n, Math.max(0, at + d));
      if (next === at) return;
      if (next === n) celebrate("small");
      else sfx.tick();
      setAt(next);
    },
    [at, n, setAt],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showIng) return;
      if (e.key === "Escape") onClose();
      const fwd = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
      const back = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
      if (e.key === fwd || e.key === " ") {
        e.preventDefault();
        go(1);
      }
      if (e.key === back) go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [go, onClose, dir, showIng]);

  // swipe between steps (towards the reading direction = next)
  const touch = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => (touch.current = e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touch.current === null) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    touch.current = null;
    if (Math.abs(dx) < 60) return;
    go((dx < 0) === (dir === "ltr") ? 1 : -1);
  };

  const secs = p.timers[at];
  const Prev = dir === "rtl" ? ChevronRight : ChevronLeft;
  const Next = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex flex-col bg-rice"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      role="dialog"
      aria-modal="true"
      aria-label={t.recipes.cookMode}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="border-b-2 border-ink bg-white pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-ink-soft">{t.recipes.cookMode}</p>
            <h2 className="truncate font-display text-lg font-extrabold" {...p.contentProps}>{p.name}</h2>
          </div>
          <button type="button" onClick={() => setShowIng(true)} className="btn btn-light btn-sm">
            🧺 <span className="hidden min-[400px]:inline">{t.recipes.ingredients}</span>
          </button>
          <button type="button" onClick={onClose} className="hit grid size-10 shrink-0 place-items-center rounded-full border-2 border-ink bg-white" aria-label={t.recipes.exit}>
            <X className="size-5" />
          </button>
        </div>
        <div className="mx-auto flex max-w-3xl gap-1 px-4 pb-3" aria-hidden>
          {p.steps.map((_, i) => (
            <span key={i} className={cx("h-2 flex-1 rounded-full border border-ink/30 transition-colors", i < at || finished ? "bg-lime" : i === at ? "bg-brand" : "bg-ink/10")} />
          ))}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-y-auto px-4 py-6 sm:py-10">
        <AnimatePresence mode="wait">
          {finished ? (
            <motion.div key="done" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="my-auto flex flex-col items-center gap-4 text-center">
              <span className="text-7xl">🍽️</span>
              <p className="font-display text-3xl font-extrabold sm:text-4xl">{t.recipes.done}</p>
              <p className="text-lg text-ink-soft">{t.recipes.doneSub}</p>
              <FavButton kind="recipes" id={p.id} />
            </motion.div>
          ) : (
            <motion.div key={at} initial={{ x: dir === "rtl" ? -40 : 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: dir === "rtl" ? 40 : -40, opacity: 0 }} transition={{ duration: 0.2 }} className="my-auto">
              <p className="mb-3 inline-flex rounded-full bg-brand px-3 py-1 text-sm font-extrabold text-white" aria-live="polite">
                {t.recipes.stepOf(at + 1, n)}
              </p>
              <p className="text-2xl font-semibold leading-relaxed sm:text-3xl sm:leading-relaxed" {...p.contentProps}>
                {p.steps[at]}
              </p>
              {secs && !p.timer && (
                <button type="button" onClick={() => p.startTimer(secs)} className="btn btn-sun mt-6">
                  <Timer className="size-5" /> {t.recipes.timer(formatMinutes(Math.round(secs / 60), locale))}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t-2 border-ink bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 px-4 pt-3">
          {p.timer && <TimerPill timer={p.timer} onToggle={p.toggleTimer} onStop={p.stopTimer} />}
          {awake && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-ink-soft">
              <Sun className="size-3.5" /> {t.recipes.awake}
            </span>
          )}
        </div>
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 pt-3">
          <button type="button" onClick={() => go(-1)} disabled={at === 0} className="btn btn-light flex-1 sm:flex-none">
            <Prev className="size-5" /> {t.recipes.prev}
          </button>
          {finished ? (
            <button type="button" onClick={onClose} className="btn btn-primary flex-[2]">
              <Check className="size-5" /> {t.recipes.exit}
            </button>
          ) : (
            <button type="button" onClick={() => go(1)} className="btn btn-primary flex-[2] text-lg">
              {at === n - 1 ? t.recipes.finish : t.recipes.next} <Next className="size-5" />
            </button>
          )}
        </div>
      </div>

      <Sheet open={showIng} onClose={() => setShowIng(false)} title={t.recipes.ingredients}>
        {p.ingredients}
      </Sheet>
    </motion.div>
  );
}
