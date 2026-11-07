import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "360 Kids Activity | Development preview",
  description: "Discover a new way to explore activities for your family.",
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
