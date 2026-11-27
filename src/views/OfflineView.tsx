"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { Heart, Home, RefreshCw } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { MESSAGES } from "@/lib/messages";
import { Lugma } from "@/components/Logo";

export function OfflineView() {
  const { t, locale } = useI18n();
  // Show the other language underneath so the page reads right whatever the saved locale.
  const other = MESSAGES[locale === "ar" ? "en" : "ar"].pwa.offline;
  return (
    <div className="px-4 py-14 sm:py-20">
      <div className="sticker mx-auto flex max-w-md flex-col items-center gap-3 p-6 text-center sm:p-8">
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2.4 }}>
          <Lugma size={96} mood="hungry" />
        </motion.div>
        <span className="rounded-full border-2 border-ink bg-sun px-3 py-0.5 text-sm font-bold">📴 offline</span>
        <h1 className="font-display text-3xl font-bold">{t.pwa.offline.title}</h1>
        <p className="text-ink-soft">{t.pwa.offline.body}</p>
        <p className="text-sm text-ink-soft/80" lang={locale === "ar" ? "en" : "ar"} dir={locale === "ar" ? "ltr" : "rtl"}>
          {other.title} — {other.body}
        </p>
        <button type="button" onClick={() => window.location.reload()} className="btn btn-primary mt-2 w-full">
          <RefreshCw className="size-5" aria-hidden /> {t.pwa.offline.retry}
        </button>
        <div className="grid w-full grid-cols-2 gap-2">
          <Link href="/favorites/" className="btn btn-light btn-sm">
            <Heart className="size-4" aria-hidden /> {t.pwa.offline.favorites}
          </Link>
          <Link href="/picker/" className="btn btn-light btn-sm">
            🎡 {t.pwa.offline.picker}
          </Link>
        </div>
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-lagoon underline-offset-4 hover:underline">
          <Home className="size-4" aria-hidden /> {t.pwa.offline.home}
        </Link>
      </div>
    </div>
  );
}
