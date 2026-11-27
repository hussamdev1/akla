"use client";
import { useEffect } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { localDateKey } from "@/lib/time";
import { usePrefersReducedMotion } from "@/lib/hooks";
import type { AchievementId } from "@/lib/store";
import { SearchOverlay } from "./shell/SearchOverlay";

export function Providers({ children }: { children: React.ReactNode }) {
  const locale = useStore((s) => s.locale);
  const motionPref = useStore((s) => s.motion);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    void Promise.resolve(useStore.persist.rehydrate()).then(() => {
      useStore.getState().touchStreak(localDateKey(new Date()));
    });
  }, []);

  useEffect(() => {
    const d = document.documentElement;
    d.lang = locale;
    d.dir = locale === "ar" ? "rtl" : "ltr";
    if (motionPref === "system") delete d.dataset.motion;
    else d.dataset.motion = motionPref;
  }, [locale, motionPref]);

  return (
    <MotionConfig reducedMotion={reduced ? "always" : "never"}>
      {children}
      <Toast />
      <SearchOverlay />
    </MotionConfig>
  );
}

function Toast() {
  const toast = useStore((s) => s.toast);
  const clear = useStore((s) => s.clearToast);
  const { t } = useI18n();

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(clear, 3200);
    return () => clearTimeout(id);
  }, [toast, clear]);

  let title = toast?.text ?? "";
  let sub = "";
  if (title.startsWith("achievement:")) {
    const id = title.split(":")[1] as AchievementId;
    title = t.achievements.unlocked;
    sub = t.achievements[id][0];
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-[100] flex justify-center px-4 lg:bottom-8" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: 40, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.9 }}
            className="sticker pointer-events-auto flex items-center gap-3 bg-ink px-5 py-3 text-white"
          >
            {toast.emoji && (
              <motion.span className="text-3xl" animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.3, 1] }} transition={{ duration: 0.8 }}>
                {toast.emoji}
              </motion.span>
            )}
            <div>
              <div className="font-display text-lg leading-tight text-sun">{title}</div>
              {sub && <div className="text-sm text-white/85">{sub}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
