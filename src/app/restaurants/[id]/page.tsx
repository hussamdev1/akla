import type { Metadata } from "next";
import { RESTAURANTS, restaurantById } from "@/data/restaurants";
import { RestaurantView } from "@/views/RestaurantView";

export const dynamicParams = false;

export function generateStaticParams() {
  return RESTAURANTS.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const r = restaurantById(id);
  return { title: r ? `${r.name.en} · ${r.name.ar}` : "Restaurant", description: r?.description.en };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RestaurantView id={id} />;
}
