import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "360 Kids Activity | Activities for curious kids",
  description:
    "Discover activities, request places and follow your family’s bookings.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
