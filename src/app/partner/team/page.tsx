import { requireIdentity, backend } from "@/lib/server-api";
import type { Provider, Page } from "@/lib/types";
import { Shell, Title } from "@/components/shell";
import { Team } from "@/components/team";
export default async function TeamPage() {
  const { actor, token } = await requireIdentity("/partner/team", "partner"),
    organizations = await backend<Page<Provider>>(
      "/providers?owned=true&status=approved&pageSize=20",
      token,
    );
  return (
    <Shell actor={actor} role="partner">
      <Title
        title="Team access"
        note="Give existing accounts staff access to your organization."
      />
      <Team organizations={organizations} />
    </Shell>
  );
}
