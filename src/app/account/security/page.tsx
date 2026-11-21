import { requireIdentity } from "@/lib/server-api";
import { safeNext } from "@/lib/navigation";
import { serverDictionary } from "@/lib/server-locale";
import { securityCopy } from "@/lib/security-copy";
import { canUseAdminPath } from "@/lib/permissions";
import type { Search } from "@/lib/page-query";
import { Shell, Title } from "@/components/shell";
import { SecurityScreen } from "@/components/security-screen";

export default async function SecurityPage({searchParams}:{searchParams:Search}) {
  const query = await searchParams;
  const proposed = safeNext(query.next);
  const next = proposed.startsWith("/account/security") ? "/parent" : proposed;
  const [{actor},{locale}] = await Promise.all([
    requireIdentity(`/account/security?next=${encodeURIComponent(next)}`),serverDictionary(),
  ]);
  const role = canUseAdminPath(actor,"/admin") ? "admin" : actor.roles.includes("partner") ? "partner" : "parent";
  return <Shell actor={actor} role={role}>
    <Title title={securityCopy[locale].title} note={securityCopy[locale].intro} />
    <SecurityScreen next={next} locale={locale} />
  </Shell>;
}
