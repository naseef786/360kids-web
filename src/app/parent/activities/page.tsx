import { CatalogueScreen } from "@/components/screens";
import type { Search } from "@/lib/page-query";
export default function Page({ searchParams }: { searchParams: Search }) {
  return <CatalogueScreen searchParams={searchParams} />;
}
