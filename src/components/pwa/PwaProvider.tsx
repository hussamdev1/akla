"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RefreshCw, WifiOff, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { BASE_PATH } from "@/lib/img";
import { applyUpdate, usePwa, type InstallPromptEvent } from "@/lib/pwa";

const UPDATE_CHECK_MS = 60 * 60 * 1000;

/** Registers the service worker (production builds only) and tracks install / update / connectivity state. */
export function PwaProvider() {
  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const ua = navigator.userAgent;
    // iPadOS reports itself as a Mac; touch points tell them apart.
    const ios = /iphone|ipad|ipod/i.test(ua) || (!/android/i.test(ua) && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    usePwa.setState({ standalone, ios, online: navigator.onLine });

    const onPrompt = (e: Event) => {
      e.preventDefault(); // keep the browser's mini-infobar away; we offer a button in Profile / More
      usePwa.setState({ installEvent: e as InstallPromptEvent });
    };
    const onInstalled = () => usePwa.setState({ installEvent: null, standalone: true });
    const onOnline = () => usePwa.setState({ online: true });
    const onOffline = () => usePwa.setState({ online: false });
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const sw = navigator.serviceWorker;
    if (process.env.NODE_ENV !== "production") {
      // A worker left over from a production build on this origin would serve stale files in dev.
      void sw.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      return;
    }

    let reg: ServiceWorkerRegistration | undefined;
    const markWaiting = (w: ServiceWorker | null) => {
      if (w && sw.controller) usePwa.setState({ waiting: w });
    };
    const onControllerChange = () => {
      if (usePwa.getState().refreshing) window.location.reload();
    };
    const check = () => {
      if (document.visibilityState === "visible") void reg?.update().catch(() => {});
    };

    sw.addEventListener("controllerchange", onControllerChange);
    sw.register(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/`, updateViaCache: "none" })
      .then((r) => {
        reg = r;
        markWaiting(r.waiting);
        r.addEventListener("updatefound", () => {
          const w = r.installing;
          w?.addEventListener("statechange", () => w.state === "installed" && markWaiting(w));
        });
      })
      .catch((err) => console.warn("[akla] service worker registration failed", err));

    document.addEventListener("visibilitychange", check);
    const id = setInterval(check, UPDATE_CHECK_MS);
    return () => {
      sw.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", check);
      clearInterval(id);
    };
  }, []);

  return <PwaToasts />;
}

function PwaToasts() {
  const { t } = useI18n();
  const waiting = usePwa((s) => s.waiting);
  const online = usePwa((s) => s.online);
  const refreshing = usePwa((s) => s.refreshing);
  // Dismissals are remembered per worker / per offline spell (adjusted during render, not in an effect).
  const [hidden, setHidden] = useState<{ update: ServiceWorker | null; offline: boolean }>({ update: null, offline: false });
  const [wasOnline, setWasOnline] = useState(online);
  if (wasOnline !== online) {
    setWasOnline(online);
    if (!online) setHidden((h) => ({ ...h, offline: false }));
  }

  const showUpdate = !!waiting && hidden.update !== waiting;
  const showOffline = !online && !hidden.offline;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-[99] flex flex-col items-center gap-2 px-4 lg:bottom-8" aria-live="polite">
      <AnimatePresence>
        {showOffline && (
          <motion.button
            key="offline"
            type="button"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            onClick={() => setHidden((h) => ({ ...h, offline: true }))}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border-2 border-ink bg-sun px-4 py-1.5 text-sm font-bold shadow-sticker-sm"
          >
            <WifiOff className="size-4 shrink-0" aria-hidden />
            {t.pwa.offlinePill}
          </motion.button>
        )}
        {showUpdate && (
          <motion.div
            key="update"
            role="status"
            initial={{ y: 40, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.9 }}
            className="sticker pointer-events-auto flex w-full max-w-md items-center gap-3 bg-ink px-4 py-3 text-white"
          >
            <span className="text-3xl" aria-hidden>
              ✨
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-display text-lg leading-tight text-sun">{t.pwa.updateTitle}</div>
              <div className="text-sm text-white/85">{t.pwa.updateBody}</div>
            </div>
            <button type="button" onClick={applyUpdate} disabled={refreshing} className="btn btn-primary btn-sm shrink-0">
              <RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} aria-hidden /> {t.pwa.refresh}
            </button>
            <button type="button" onClick={() => setHidden((h) => ({ ...h, update: waiting }))} className="hit grid size-8 shrink-0 place-items-center rounded-full text-white/80 hover:bg-white/10" aria-label={t.pwa.later}>
              <X className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
