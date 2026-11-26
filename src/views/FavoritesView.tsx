"use client";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FolderPlus, Plus, Trash2 } from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { MEALS } from "@/data/meals";
import { RESTAURANTS } from "@/data/restaurants";
import { useI18n } from "@/lib/i18n";
import { useDistances, useMounted, useOffers } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import type { FavKind } from "@/lib/types";
import { CategoryCard, MealCard, OfferCard, RestaurantCard } from "@/components/cards";
import { Container, cx, EmptyState, FoodImage, PageHero, Sheet } from "@/components/ui";

const EMOJIS = ["🍔", "🍕", "⭐", "💸", "👨‍👩‍👧", "🌙", "🔥", "🥗", "🍰", "📍"];

export function FavoritesView() {
  const { t, l } = useI18n();
  const mounted = useMounted();
  const favs = useStore((s) => s.favorites);
  const collections = useStore((s) => s.collections);
  const addCollection = useStore((s) => s.addCollection);
  const deleteCollection = useStore((s) => s.deleteCollection);
  const toggleIn = useStore((s) => s.toggleInCollection);
  const dist = useDistances();
  const { all } = useOffers();
  const [tab, setTab] = useState<FavKind>("restaurants");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("⭐");
  const [openCol, setOpenCol] = useState<string | null>(null);
  const [adding, setAdding] = useState<{ kind: FavKind; id: string } | null>(null);

  const tabs: { id: FavKind; e: string }[] = [
    { id: "restaurants", e: "🍽️" }, { id: "meals", e: "🍔" }, { id: "offers", e: "🏷️" }, { id: "categories", e: "🗂️" },
  ];
  const ids = mounted ? favs[tab] : [];
  const col = collections.find((c) => c.id === openCol);

  const renderItem = (kind: FavKind, id: string) => {
    if (kind === "restaurants") {
      const r = RESTAURANTS.find((x) => x.id === id);
      return r && <RestaurantCard r={r} km={dist[r.id]} />;
    }
    if (kind === "meals") {
      const m = MEALS.find((x) => x.id === id);
      return m && <MealCard m={m} km={dist[m.restaurantId]} />;
    }
    if (kind === "offers") {
      const o = all.find((x) => x.id === id);
      return o && <OfferCard o={o} km={dist[o.restaurantId]} />;
    }
    const c = CATEGORIES.find((x) => x.id === id);
    return c && <CategoryCard c={c} />;
  };

  const itemLabel = (kind: FavKind, id: string) => {
    if (kind === "restaurants") { const r = RESTAURANTS.find((x) => x.id === id); return r ? [r.emoji, l(r.name), r.cover] as const : null; }
    if (kind === "meals") { const m = MEALS.find((x) => x.id === id); return m ? [m.emoji, l(m.name), m.image] as const : null; }
    if (kind === "categories") { const c = CATEGORIES.find((x) => x.id === id); return c ? [c.emoji, l(c.name), c.image] as const : null; }
    const o = all.find((x) => x.id === id); return o ? ["🏷️", l(o.title), undefined] as const : null;
  };

  return (
    <>
      <PageHero title={t.favorites.title} subtitle={t.favorites.subtitle} emoji="❤️" color="#F2542D" />
      <Container className="py-10">
        {/* Collections */}
        <section className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-3xl font-bold">📚 {t.favorites.collections}</h2>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
              <FolderPlus className="size-4" /> {t.favorites.newCollection}
            </button>
          </div>
          <div className="scroll-row">
            {mounted && collections.map((c, i) => {
              const covers = c.items.slice(0, 4).map((it) => itemLabel(it.kind, it.id)).filter(Boolean);
              return (
                <motion.button key={c.id} type="button" onClick={() => setOpenCol(c.id)} whileHover={{ y: -6, rotate: i % 2 ? 2 : -2 }} className="sticker w-52 overflow-hidden text-start">
                  <div className="grid aspect-square grid-cols-2 border-b-2 border-ink bg-rice">
                    {[0, 1, 2, 3].map((k) => (
                      <div key={k} className="overflow-hidden border-ink/20 [&:nth-child(odd)]:border-e [&:nth-child(-n+2)]:border-b">
                        {covers[k] ? <FoodImage src={covers[k]![2]} emoji={covers[k]![0]} alt="" size="small" className="size-full" /> : <div className="grid size-full place-items-center text-2xl opacity-30">{c.emoji}</div>}
                      </div>
                    ))}
                  </div>
                  <div className="p-3">
                    <div className="truncate font-display text-lg font-bold">{c.emoji} {c.name}</div>
                    <div className="text-sm text-ink-soft">{c.items.length}</div>
                  </div>
                </motion.button>
              );
            })}
            <button type="button" onClick={() => setCreating(true)} className="grid w-52 shrink-0 place-items-center rounded-[1.5rem] border-2 border-dashed border-ink/40 p-6 text-center font-bold text-ink-soft hover:bg-white">
              <span><Plus className="mx-auto mb-1 size-8" />{t.favorites.newCollection}</span>
            </button>
          </div>
        </section>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((x) => (
            <button key={x.id} type="button" className="chip !px-4 !py-2 !text-base" aria-pressed={tab === x.id} onClick={() => setTab(x.id)}>
              {x.e} {t.favorites.tabs[x.id]} <span className="opacity-60">({mounted ? favs[x.id].length : 0})</span>
            </button>
          ))}
        </div>
        {ids.length ? (
          <div className={cx("grid gap-5", tab === "categories" ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-6" : "sm:grid-cols-2 lg:grid-cols-3")}>
            <AnimatePresence mode="popLayout">
              {ids.map((id) => (
                <motion.div key={id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="relative">
                  {renderItem(tab, id)}
                  {collections.length > 0 && (
                    <button type="button" onClick={() => setAdding({ kind: tab, id })} className="absolute bottom-3 end-3 z-10 grid size-9 place-items-center rounded-full border-2 border-ink bg-sun shadow-[2px_2px_0_#2B1B3D]" aria-label={t.favorites.addTo}>
                      <FolderPlus className="size-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <EmptyState title={t.favorites.empty} action={<Link href="/discover/" className="btn btn-primary">{t.nav.discover}</Link>} />
        )}
      </Container>

      {/* Create collection */}
      <Sheet open={creating} onClose={() => setCreating(false)} title={t.favorites.newCollection}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            addCollection(name.trim(), emoji);
            setName("");
            setCreating(false);
          }}
        >
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.favorites.namePh} maxLength={40} autoFocus />
          <div className="flex flex-wrap gap-2">
            {t.favorites.suggestions.map((s) => <button key={s} type="button" className="chip !text-xs" onClick={() => setName(s)}>{s}</button>)}
          </div>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => setEmoji(e)} className={cx("grid size-11 place-items-center rounded-xl border-2 border-ink text-xl", emoji === e ? "bg-sun" : "bg-white")}>{e}</button>
            ))}
          </div>
          <button className="btn btn-primary w-full">{t.favorites.create}</button>
        </form>
      </Sheet>

      {/* Add to collection */}
      <Sheet open={!!adding} onClose={() => setAdding(null)} title={t.favorites.addTo}>
        <div className="space-y-2">
          {adding && collections.map((c) => {
            const has = c.items.some((i) => i.kind === adding.kind && i.id === adding.id);
            return (
              <button key={c.id} type="button" onClick={() => toggleIn(c.id, adding.kind, adding.id)} className={cx("flex w-full items-center justify-between rounded-2xl border-2 border-ink p-3 font-bold", has ? "bg-lime" : "bg-white")}>
                <span>{c.emoji} {c.name}</span>
                <span>{has ? "✓" : "+"}</span>
              </button>
            );
          })}
        </div>
      </Sheet>

      {/* Open collection */}
      <Sheet open={!!col} onClose={() => setOpenCol(null)} title={col ? `${col.emoji} ${col.name}` : ""} wide>
        {col && (
          <>
            {col.items.length ? (
              <div className="space-y-2">
                {col.items.map((it) => {
                  const lab = itemLabel(it.kind, it.id);
                  return lab ? (
                    <div key={it.kind + it.id} className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-white p-2">
                      <FoodImage src={lab[2]} emoji={lab[0]} alt="" size="small" className="size-12 rounded-xl border-2 border-ink" />
                      <span className="flex-1 font-bold">{lab[1]}</span>
                      <button type="button" onClick={() => toggleIn(col.id, it.kind, it.id)} aria-label="remove"><Trash2 className="size-4 text-chili" /></button>
                    </div>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="text-center font-semibold text-ink-soft">{t.favorites.empty}</p>
            )}
            <button type="button" className="btn btn-light btn-sm mt-5 !text-chili" onClick={() => { deleteCollection(col.id); setOpenCol(null); }}>
              <Trash2 className="size-4" /> {t.common.clear}
            </button>
          </>
        )}
      </Sheet>
    </>
  );
}
