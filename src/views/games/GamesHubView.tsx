"use client";
import Link from "next/link";
import { useLive } from "@/lib/hooks";
import { motion } from "motion/react";
import { useI18n } from "@/lib/i18n";
import { ACHIEVEMENTS, achievementProgress, useStore } from "@/lib/store";
import { Container, PageHero, Reveal, SectionHeader, Tilt } from "@/components/ui";
import { AchievementBadge } from "@/views/ProfileView";

export function GamesHubView() {
  const { hasMeals: HAS_MEALS } = useLive();
  const { t } = useI18n();
  const state = useStore();
  const prog = achievementProgress(state);
  const games = [
    ...(HAS_MEALS
      ? [
          { href: "/games/battle/", e: "⚔️", title: t.games.battle.title, desc: t.games.battle.desc, c: "#F2542D" },
          { href: "/games/mystery/", e: "🎁", title: t.games.mystery.title, desc: t.games.mystery.desc, c: "#FFD23F" },
        ]
      : []),
    { href: "/games/challenges/", e: "🎯", title: t.games.challenges.title, desc: t.games.challenges.desc, c: "#9BE15D" },
    { href: "/games/group/", e: "👯", title: t.games.group.title, desc: t.games.group.desc, c: "#7DD3FC" },
    { href: "/picker/", e: "🎡", title: t.picker.title, desc: t.picker.subtitle, c: "#E63462" },
    { href: "/games/challenges/#random", e: "🎲", title: t.games.challenges.random, desc: t.games.challenges.generate, c: "#E9B5FF" },
  ];
  return (
    <>
      <PageHero title={t.games.title} subtitle={t.games.subtitle} emoji="🎮" color="#0E8C99" />
      <Container className="py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g, i) => (
            <Reveal key={g.href} delay={i * 0.05}>
              <Tilt>
                <Link href={g.href} className="sticker group relative flex h-full flex-col gap-3 overflow-hidden p-6" style={{ background: g.c }}>
                  <motion.span className="text-6xl" whileHover={{ scale: 1.25, rotate: -12 }}>{g.e}</motion.span>
                  <h2 className="font-display text-3xl font-extrabold">{g.title}</h2>
                  <p className="font-medium">{g.desc}</p>
                  <span className="btn btn-light btn-sm mt-auto w-fit">{t.home.play} <span className="rtl:rotate-180">→</span></span>
                  <span className="pointer-events-none absolute -end-6 -top-6 text-[8rem] opacity-15 transition-transform group-hover:rotate-12">{g.e}</span>
                </Link>
              </Tilt>
            </Reveal>
          ))}
        </div>

        <section className="mt-14">
          <SectionHeader title={t.profile.achievements} emoji="🏅" href="/profile/" />
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-9">
            {ACHIEVEMENTS.map((a) => (
              <AchievementBadge key={a.id} a={a} unlocked={!!state.achievements[a.id]} progress={prog[a.id]} />
            ))}
          </div>
        </section>
      </Container>
    </>
  );
}
