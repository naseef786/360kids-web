import Platform from "@/components/platform";
import { notFound } from "next/navigation";
const pages = new Set([
  "",
  "activities",
  "sign-in",
  "reset-password",
  "account/support",
  "provider/support",
  "admin/support",
  "admin/content",
  "admin/corrections",
  "about",
  "contact",
  "faq",
  "terms",
  "privacy",
  "become-a-provider",
  "account",
  "account/bookings",
  "account/children",
  "account/settings",
  "provider",
  "provider/requests",
  "provider/activities",
  "provider/profile",
  "provider/subscription",
  "admin",
  "admin/bookings",
  "admin/providers",
  "admin/activities",
  "admin/finance",
  "admin/contacts",
  "admin/campaigns",
  "admin/subscriptions",
  "admin/audit",
]);
export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  const name = path.join("/");
  if (
    !pages.has(name) &&
    !/^activities\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      name,
    )
  )
    notFound();
  return <Platform />;
}
