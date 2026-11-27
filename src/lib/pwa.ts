"use client";
import { create } from "zustand";

/** Chromium's install prompt event (not in lib.dom). */
export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaState = {
  /** A new service worker is installed and waiting to take over. */
  waiting: ServiceWorker | null;
  /** Saved `beforeinstallprompt` event (Chromium only). */
  installEvent: InstallPromptEvent | null;
  /** Running as an installed app (display-mode: standalone or iOS home-screen). */
  standalone: boolean;
  /** iPhone/iPad, where installing is a manual "Add to Home Screen". */
  ios: boolean;
  online: boolean;
  /** User asked to refresh: reload once the new worker takes control. */
  refreshing: boolean;
};

export const usePwa = create<PwaState>(() => ({ waiting: null, installEvent: null, standalone: false, ios: false, online: true, refreshing: false }));

/** Activate the waiting service worker; PwaProvider reloads on `controllerchange`. */
export function applyUpdate() {
  const { waiting } = usePwa.getState();
  if (!waiting) return window.location.reload();
  usePwa.setState({ refreshing: true });
  waiting.postMessage({ type: "SKIP_WAITING" });
}

export async function promptInstall() {
  const ev = usePwa.getState().installEvent;
  if (!ev) return false;
  await ev.prompt();
  const { outcome } = await ev.userChoice;
  usePwa.setState({ installEvent: null });
  return outcome === "accepted";
}
