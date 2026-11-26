import type { Metadata, Viewport } from "next";
import { Baloo_Bhaijaan_2, Rubik } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/shell/Header";
import { BottomNav } from "@/components/shell/BottomNav";
import { Footer } from "@/components/shell/Footer";

const baloo = Baloo_Bhaijaan_2({ subsets: ["arabic", "latin"], weight: ["500", "600", "700", "800"], variable: "--font-baloo", display: "swap" });
const rubik = Rubik({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-rubik", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Akla · أكلة — شنو ناكل اليوم؟", template: "%s · Akla" },
  description: "Discover food, deals and fun ways to decide what to eat in Kuwait. اكتشف الأكل والعروض وقرر شنو تاكل اليوم.",
  applicationName: "Akla",
};

export const viewport: Viewport = { themeColor: "#E63462", width: "device-width", initialScale: 1 };

// Runs before paint: apply saved language direction + motion preference to avoid a layout flash.
const boot = `try{var s=(JSON.parse(localStorage.getItem('akla')||'{}').state)||{};var l=s.locale||'ar';var d=document.documentElement;d.lang=l;d.dir=l==='ar'?'rtl':'ltr';if(s.motion&&s.motion!=='system')d.dataset.motion=s.motion;}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${baloo.variable} ${rubik.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
      </head>
      <body className="min-h-dvh antialiased">
        <Providers>
          <Header />
          <main className="min-h-[70dvh]">{children}</main>
          <Footer />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
