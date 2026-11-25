import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@/components/workspace.css";
import "@/components/connected.css";
import { serverLocale } from "@/lib/server-locale";
export const metadata: Metadata = {
  title: "360 Kids Activity",
  description: "Discover and request children's activities across Dubai.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F5A300",
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
