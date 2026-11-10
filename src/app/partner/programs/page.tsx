import { ProgramsScreen } from "@/components/screens";
import type { Search } from "@/lib/page-query";
export default function Page({ searchParams }: { searchParams: Search }) {
  return <ProgramsScreen searchParams={searchParams} />;
}
