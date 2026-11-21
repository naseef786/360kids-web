import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { PreviewGallery } from "@/components/preview-gallery";

export const metadata = { title: "Fictional UI preview | 360 Kids Activity", robots: { index: false, follow: false } };

export default function PreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Shell publicPage><PreviewGallery /></Shell>;
}
