import { OrganizationsScreen } from "@/components/screens";
import type { Search } from "@/lib/page-query";
export default function Page({ searchParams }: { searchParams: Search }) {
  return <OrganizationsScreen searchParams={searchParams} />;
}
