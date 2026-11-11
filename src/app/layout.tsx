import type { Metadata } from "next";
import "./globals.css";
import "@/components/workspace.css";
import "@/components/connected.css";
import { serverLocale } from "@/lib/server-locale";
export const metadata: Metadata = {
  title: "360 Kids Activity | Development preview",
  description: "Discover a new way to explore activities for your family.",
  robots: { index: false, follow: false },
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await serverLocale();
  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-scroll-behavior="smooth"
    >
      <body>{children}</body>
    </html>
  );
}
