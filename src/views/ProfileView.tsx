"use client";
import { motion } from "motion/react";
import { useI18n } from "@/lib/i18n";
import { ACHIEVEMENTS, achievementProgress, useStore, type AchievementId } from "@/lib/store";
import { Container, cx, PageHero, Toggle } from "@/components/ui";
import { Lugma } from "@/components/Logo";
import { LangToggle } from "@/components/shell/Header";

export function AchievementBadge({ a, unlocked, progress }: { a: { id: AchievementId; emoji: string; color: string; goal: number }; unlocked: boolean; progress: number }) {
  const { t } = useI18n();
  const pct = Math.min(1, progress / a.goal);
  return (
    <motion.div whileHover={{ y: -4, rotate: unlocked ? -4 : 0 }} className="flex flex-col items-center gap-1 text-center" title={t.achievements[a.id][1]}>
      <div className="relative size-20">
        <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
          <circle cx="40" cy="40" r="35" fill="none" stroke="#2B1B3D22" strokeWidth="6" />
          <motion.circle cx="40" cy="40" r="35" fill="none" stroke={a.color} strokeWidth="6" strokeLinecap="round" strokeDasharray={220} initial={{ strokeDashoffset: 220 }} animate={{ strokeDashoffset: 220 * (1 - pct) }} transition={{ duration: 1 }} />
        </svg>
        <div className={cx("absolute inset-2 grid place-items-center rounded-full border-2 border-ink text-3xl", unlocked ? "shadow-[2px_2px_0_#2B1B3D]" : "grayscale opacity-50")} style={{ background: unlocked ? a.color : "#fff" }}>
          {unlocked ? a.emoji : "🔒"}
        </div>
      </div>
      <span className="text-xs font-bold leading-tight">{t.achievements[a.id][0]}</span>
      <span className="text-[10px] text-ink-soft">{Math.min(progress, a.goal)}/{a.goal}</span>
    </motion.div>
  );
}

export function ProfileView() {
  const { t } = useI18n();
  const state = useStore();
  const prog = achievementProgress(state);
  const unlocked = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).length;
  const saves = Object.values(state.favorites).reduce((s, l) => s + l.length, 0);
  const stats = [
    { e: "🎡", label: t.profile.spins, v: state.spinCount },
    { e: "👀", label: t.profile.views, v: Object.keys(state.views).length },
    { e: "❤️", label: t.profile.saves, v: saves },
    { e: "🏆", label: t.profile.battles, v: state.battlesWon },
  ];

  return (
    <>
      <PageHero title={t.profile.title} subtitle={t.profile.local} emoji="🏅" color="#FF8FAB" />
      <Container className="grid gap-8 py-10 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-10">
          <section className="sticker flex flex-wrap items-center gap-6 p-6">
            <motion.div animate={{ rotate: [0, -6, 6, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
              <Lugma size={96} />
            </motion.div>
            <div className="flex-1">
              <p className="font-semibold text-ink-soft">{t.profile.streak}</p>
              <p className="font-display text-5xl font-extrabold text-brand">🔥 {t.profile.days(state.streak.count)}</p>
              <div className="mt-2 flex gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <span key={i} className={cx("h-3 flex-1 rounded-full border-2 border-ink", i < Math.min(state.streak.count, 7) ? "bg-brand" : "bg-white")} />
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-display text-3xl font-bold">📊 {t.profile.stats}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="sticker p-4 text-center">
                  <div className="text-3xl">{s.e}</div>
                  <div className="font-display text-3xl font-extrabold">{s.v}</div>
                  <div className="text-sm font-semibold text-ink-soft">{s.label}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-display text-3xl font-bold">
              🏅 {t.profile.achievements} <span className="text-lg text-ink-soft">({unlocked}/{ACHIEVEMENTS.length})</span>
            </h2>
            <div className="sticker grid grid-cols-3 gap-5 p-6 sm:grid-cols-5">
              {ACHIEVEMENTS.map((a) => <AchievementBadge key={a.id} a={a} unlocked={!!state.achievements[a.id]} progress={prog[a.id]} />)}
            </div>
          </section>
        </div>

        <aside className="sticker h-fit space-y-5 p-5">
          <h2 className="font-display text-2xl font-bold">⚙️ {t.profile.settings}</h2>
          <div className="flex items-center justify-between font-semibold">
            {t.profile.language} <LangToggle />
          </div>
          <div>
            <p className="mb-2 font-semibold">{t.profile.motion}</p>
            <div className="flex flex-wrap gap-2">
              {(["system", "full", "reduced"] as const).map((m) => (
                <button key={m} type="button" className="chip" aria-pressed={state.motion === m} onClick={() => state.setMotion(m)}>
                  {m === "system" ? t.profile.motionSystem : m === "full" ? t.profile.motionFull : t.profile.motionReduced}
                </button>
              ))}
            </div>
          </div>
          <Toggle checked={state.sound} onChange={state.setSound} label={`🔊 ${t.profile.sound}`} />
          <button
            type="button"
            className="btn btn-light btn-sm w-full !text-chili"
            onClick={() => {
              if (window.confirm(t.profile.resetConfirm)) state.resetAll();
            }}
          >
            🗑️ {t.profile.reset}
          </button>
        </aside>
      </Container>
    </>
  );
}
