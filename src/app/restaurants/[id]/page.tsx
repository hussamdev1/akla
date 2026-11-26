import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RESTAURANTS, restaurantById } from "@/data/restaurants";
import { RestaurantView } from "@/views/RestaurantView";

export const dynamicParams = false;

export function generateStaticParams() {
  // static export needs at least one path; "_" renders the not-found state when no listings exist yet
  return RESTAURANTS.length ? RESTAURANTS.map((r) => ({ id: r.id })) : [{ id: "_" }];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const r = restaurantById(id);
  return { title: r ? `${r.name.en} · ${r.name.ar}` : "Restaurant", description: r?.description.en };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!restaurantById(id)) notFound();
  return <RestaurantView id={id} />;
}
