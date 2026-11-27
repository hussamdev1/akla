"use client";
import Link from "next/link";
import { OSM_COUNT } from "@/data/live";
import { useI18n } from "@/lib/i18n";
import { EmptyState } from "./ui";

/** Shown where a feature needs real menus / offers that haven't been added yet. Points to the real places instead. */
export function LiveSoon({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <div className={className}>
      <EmptyState
        title={t.places.soonTitle}
        body={t.places.soonBody}
        action={
          <Link href="/restaurants/?tab=all" className="btn btn-primary w-full">
            🗺️ {t.places.soonCta(OSM_COUNT)}
          </Link>
        }
      />
    </div>
  );
}
