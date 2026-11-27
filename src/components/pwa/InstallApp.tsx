"use client";
import { useState } from "react";
import { Download, Share, SquarePlus, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { promptInstall, usePwa } from "@/lib/pwa";
import { cx, Sheet } from "@/components/ui";

/**
 * "Install Akla" — uses the browser's install prompt where available (Chromium), otherwise opens
 * "Add to Home Screen" instructions (iOS Safari) or generic browser-menu instructions.
 * `compact` renders a single button (More sheet); the default renders a small card (Profile settings).
 */
export function InstallApp({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { t } = useI18n();
  const standalone = usePwa((s) => s.standalone);
  const installEvent = usePwa((s) => s.installEvent);
  const ios = usePwa((s) => s.ios);
  const [help, setHelp] = useState(false);

  if (standalone) {
    return compact ? null : (
      <p className={cx("flex items-center gap-2 text-sm font-semibold text-ink-soft", className)}>
        <Check className="size-4 text-lagoon" aria-hidden /> {t.pwa.installed}
      </p>
    );
  }

  const onClick = async () => {
    if (installEvent) await promptInstall();
    else setHelp(true);
  };

  const button = (
    <button type="button" onClick={onClick} className={cx("btn btn-light btn-sm w-full", compact && className)}>
      <Download className="size-4" aria-hidden /> {t.pwa.install}
    </button>
  );

  return (
    <>
      {compact ? (
        button
      ) : (
        <div className={cx("space-y-2", className)}>
          <p className="text-sm text-ink-soft">{t.pwa.installSub}</p>
          {button}
        </div>
      )}
      <Sheet open={help} onClose={() => setHelp(false)} title={t.pwa.howTo}>
        {ios ? (
          <ol className="space-y-3">
            {t.pwa.iosSteps.map((step, i) => (
              <li key={step} className="sticker flex items-center gap-3 p-3 font-semibold">
                <span className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-ink bg-sun font-display">{i + 1}</span>
                <span className="flex-1">{step}</span>
                {i === 0 && <Share className="size-5 shrink-0 text-lagoon" aria-hidden />}
                {i === 1 && <SquarePlus className="size-5 shrink-0 text-lagoon" aria-hidden />}
              </li>
            ))}
          </ol>
        ) : (
          <p className="sticker p-4 font-semibold">{t.pwa.otherBrowser}</p>
        )}
        <p className="mt-4 text-sm text-ink-soft">{t.pwa.installSub}</p>
      </Sheet>
    </>
  );
}
