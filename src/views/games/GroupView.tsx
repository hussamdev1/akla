"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Share2, ThumbsUp, Trash2, X } from "lucide-react";
import { MEALS } from "@/data/meals";
import { RESTAURANTS } from "@/data/restaurants";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { norm } from "@/lib/search";
import { celebrate } from "@/lib/fx";
import { Wheel, type WheelHandle } from "@/components/Wheel";
import { Container, cx, PageHero } from "@/components/ui";

type Option = { id: string; label: string; emoji: string };
type Ballot = { likes: string[]; veto: string | null };

const encode = (o: Option[]) => btoa(unescape(encodeURIComponent(JSON.stringify(o.map((x) => [x.label, x.emoji])))));
const decode = (s: string): Option[] => {
  try {
    return (JSON.parse(decodeURIComponent(escape(atob(s)))) as [string, string][]).map(([label, emoji], i) => ({ id: `s${i}`, label, emoji }));
  } catch {
    return [];
  }
};

export function GroupView() {
  const { t, l } = useI18n();
  const showToast = useStore((s) => s.showToast);
  const [people, setPeople] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [q, setQ] = useState("");
  const [phase, setPhase] = useState<"setup" | "vote" | "results">("setup");
  const [turn, setTurn] = useState(0);
  const [ballots, setBallots] = useState<Record<string, Ballot>>({});
  const [winner, setWinner] = useState<Option | null>(null);
  const wheel = useRef<WheelHandle>(null);

  useEffect(() => {
    const m = window.location.hash.match(/o=([^&]+)/);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value read after hydration (static export)
    if (m) setOptions(decode(m[1]));
  }, []);

  const suggestions = useMemo(() => {
    const nq = norm(q);
    if (!nq) return [];
    const rs = RESTAURANTS.filter((r) => norm(r.name.ar + " " + r.name.en).includes(nq)).map((r) => ({ id: r.id, label: l(r.name), emoji: r.emoji }));
    const ms = MEALS.filter((m) => norm(m.name.ar + " " + m.name.en).includes(nq)).map((m) => ({ id: m.id, label: l(m.name), emoji: m.emoji }));
    return [...rs, ...ms].slice(0, 6);
  }, [q, l]);

  const addOption = (o: Option) => {
    if (options.some((x) => x.label === o.label) || options.length >= 12) return;
    setOptions([...options, o]);
    setQ("");
  };

  const current = people[turn];
  const ballot = ballots[current] ?? { likes: [], veto: null };
  const setBallot = (b: Ballot) => setBallots({ ...ballots, [current]: b });

  const tally = useMemo(() => {
    const vetoed = new Set(Object.values(ballots).map((b) => b.veto).filter(Boolean) as string[]);
    return options
      .map((o) => ({ o, score: Object.values(ballots).filter((b) => b.likes.includes(o.id)).length, vetoed: vetoed.has(o.id) }))
      .sort((a, b) => Number(a.vetoed) - Number(b.vetoed) || b.score - a.score);
  }, [ballots, options]);

  const top = tally.filter((x) => !x.vetoed);
  const best = top[0]?.score ?? 0;
  const finalists = top.filter((x) => x.score >= Math.max(best - 1, 0)).slice(0, 6).map((x) => x.o);

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#o=${encode(options)}`;
    try {
      if (navigator.share) await navigator.share({ title: t.games.group.title, url });
      else {
        await navigator.clipboard.writeText(url);
        showToast(t.common.copied, "🔗");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <>
      <PageHero title={`👯 ${t.games.group.title}`} subtitle={t.games.group.desc} color="#7DD3FC" />
      <Container className="py-8">
        <p className="mb-6 rounded-2xl border-2 border-dashed border-ink/40 bg-white p-3 text-sm font-semibold text-ink-soft">ℹ️ {t.games.group.note}</p>

        {phase === "setup" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="sticker p-5">
              <h2 className="mb-3 font-display text-2xl font-bold">🙋 {t.games.group.people}</h2>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (name.trim() && !people.includes(name.trim()) && people.length < 10) setPeople([...people, name.trim()]);
                  setName("");
                }}
              >
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.games.group.addPerson} maxLength={20} />
                <button className="btn btn-primary btn-sm" aria-label={t.games.group.addPerson}><Plus className="size-5" /></button>
              </form>
              <div className="mt-3 flex flex-wrap gap-2">
                {people.map((p, i) => (
                  <motion.span key={p} initial={{ scale: 0 }} animate={{ scale: 1 }} className="chip" style={{ background: ["#FFE3C9", "#D9FBEF", "#F3E8FF", "#FFF7CC", "#DDF1FF"][i % 5] }}>
                    {p}
                    <button type="button" onClick={() => setPeople(people.filter((x) => x !== p))} aria-label="remove"><X className="size-3.5" /></button>
                  </motion.span>
                ))}
              </div>
            </section>
            <section className="sticker p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-2xl font-bold">📝 {t.games.group.options}</h2>
                {options.length > 0 && <button type="button" className="btn btn-light btn-sm" onClick={share}><Share2 className="size-4" /> {t.games.group.share}</button>}
              </div>
              <form
                className="relative"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (q.trim()) addOption(suggestions[0] ?? { id: `c${Date.now()}`, label: q.trim(), emoji: "🍽️" });
                }}
              >
                <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.games.group.addOption} />
                {suggestions.length > 0 && (
                  <div className="sticker absolute inset-x-0 top-14 z-10 p-1">
                    {suggestions.map((s) => (
                      <button key={s.id} type="button" onClick={() => addOption(s)} className="block w-full rounded-xl px-3 py-2 text-start font-semibold hover:bg-rice">
                        {s.emoji} {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </form>
              <ul className="mt-3 space-y-2">
                {options.map((o) => (
                  <motion.li key={o.id} layout initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center justify-between rounded-xl border-2 border-ink bg-white px-3 py-2 font-semibold">
                    <span>{o.emoji} {o.label}</span>
                    <button type="button" onClick={() => setOptions(options.filter((x) => x.id !== o.id))} aria-label="remove"><Trash2 className="size-4 text-chili" /></button>
                  </motion.li>
                ))}
              </ul>
            </section>
            <button type="button" disabled={people.length < 2 || options.length < 2} onClick={() => { setPhase("vote"); setTurn(0); setBallots({}); }} className="btn btn-primary py-4 font-display text-xl lg:col-span-2">
              🗳️ {t.games.group.start}
            </button>
          </div>
        )}

        {phase === "vote" && current && (
          <AnimatePresence mode="wait">
            <motion.div key={current} initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -80, opacity: 0 }} className="mx-auto max-w-xl">
              <h2 className="mb-1 text-center font-display text-4xl font-extrabold">{t.games.group.turn(current)}</h2>
              <p className="mb-5 text-center text-sm font-semibold text-ink-soft">{turn + 1} / {people.length}</p>
              <div className="space-y-2">
                {options.map((o) => {
                  const liked = ballot.likes.includes(o.id);
                  const vetoed = ballot.veto === o.id;
                  return (
                    <div key={o.id} className={cx("flex items-center gap-2 rounded-2xl border-2 border-ink bg-white p-2 ps-4", vetoed && "bg-chili/15 line-through")}>
                      <span className="flex-1 font-bold">{o.emoji} {o.label}</span>
                      <button type="button" onClick={() => setBallot({ likes: liked ? ballot.likes.filter((x) => x !== o.id) : [...ballot.likes, o.id], veto: vetoed ? null : ballot.veto })} className={cx("btn btn-sm", liked ? "btn-lime" : "btn-light")} aria-pressed={liked}>
                        <ThumbsUp className="size-4" /> {t.games.group.vote}
                      </button>
                      <button type="button" onClick={() => setBallot({ likes: ballot.likes.filter((x) => x !== o.id), veto: vetoed ? null : o.id })} className={cx("btn btn-sm", vetoed ? "btn-chili" : "btn-light")} aria-pressed={vetoed}>
                        🚫 {t.games.group.veto}
                      </button>
                    </div>
                  );
                })}
              </div>
              <button type="button" className="btn btn-primary mt-5 w-full" onClick={() => (turn + 1 < people.length ? setTurn(turn + 1) : setPhase("results"))}>
                {turn + 1 < people.length ? `${t.games.group.next} →` : `📊 ${t.games.group.results}`}
              </button>
            </motion.div>
          </AnimatePresence>
        )}

        {phase === "results" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <section className="sticker p-5">
              <h2 className="mb-4 font-display text-3xl font-bold">📊 {t.games.group.results}</h2>
              <div className="space-y-3">
                {tally.map(({ o, score, vetoed }, i) => (
                  <div key={o.id} className={cx(vetoed && "opacity-50")}>
                    <div className="mb-1 flex justify-between font-bold">
                      <span className={cx(vetoed && "line-through")}>{o.emoji} {o.label}</span>
                      <span>{vetoed ? `🚫 ${t.games.group.vetoed}` : `${score} 👍`}</span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full border-2 border-ink bg-white">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(score / people.length) * 100}%` }} transition={{ delay: i * 0.1, duration: 0.8 }} className={cx("h-full", vetoed ? "bg-ink/30" : i === 0 ? "bg-brand" : "bg-sun")} />
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-light btn-sm mt-5" onClick={() => { setPhase("setup"); setWinner(null); }}>↺ {t.common.reset}</button>
            </section>
            <section className="flex flex-col items-center">
              <h2 className="mb-4 text-center font-display text-2xl font-bold">🎡 {t.games.group.spinTop}</h2>
              {finalists.length >= 2 ? (
                <>
                  <Wheel ref={wheel} items={finalists} onResult={(i) => { setWinner(finalists[i]); celebrate("big"); }} />
                  <button type="button" className="btn btn-primary mt-4" onClick={() => wheel.current?.spin()}>{t.picker.spin}</button>
                </>
              ) : finalists[0] ? (
                <p className="font-display text-4xl">{finalists[0].emoji} {finalists[0].label}</p>
              ) : null}
              <AnimatePresence>
                {winner && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="sticker mt-6 bg-sun px-6 py-4 text-center">
                    <p className="font-bold">{t.games.group.winner}</p>
                    <p className="font-display text-3xl font-extrabold">{winner.emoji} {winner.label}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>
        )}
      </Container>
    </>
  );
}
