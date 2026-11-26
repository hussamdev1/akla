"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="px-4 py-20">
      <EmptyState title={t.notFound.title} body={t.notFound.body} action={<Link href="/" className="btn btn-primary">{t.notFound.home}</Link>} />
    </div>
  );
}
