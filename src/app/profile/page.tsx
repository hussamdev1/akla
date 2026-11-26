import type { Metadata } from "next";
import { ProfileView } from "@/views/ProfileView";

export const metadata: Metadata = { title: "My Profile · ملفي" };

export default function Page() {
  return <ProfileView />;
}
