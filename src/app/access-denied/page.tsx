import Link from "next/link";
import { requireIdentity } from "@/lib/server-api";
import { Shell, Empty } from "@/components/shell";
export default async function AccessDenied() {
  const { actor } = await requireIdentity("/parent");
  return (
    <Shell actor={actor}>
      <Empty
        title="This workspace needs additional access"
        note="Your family account is ready to use. Partner and platform workspaces require approval."
      >
        <Link className="btn" href="/parent">
          Open your family account
        </Link>
        <Link className="text-link" href="/partner/apply">
          Apply as a partner
        </Link>
      </Empty>
    </Shell>
  );
}
