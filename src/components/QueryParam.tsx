"use client";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function Inner({ name, onValue }: { name: string; onValue: (v: string | null) => void }) {
  const sp = useSearchParams();
  const v = sp.get(name);
  useEffect(() => {
    onValue(v);
  }, [v, onValue]);
  return null;
}

/** Reads a query param without forcing the whole page into client-only rendering (static export friendly). */
export function QueryParam(props: { name: string; onValue: (v: string | null) => void }) {
  return (
    <Suspense fallback={null}>
      <Inner {...props} />
    </Suspense>
  );
}
