import Link from "next/link";
import { requireIdentity, backend } from "@/lib/server-api";
import { pageQuery, type Search } from "@/lib/page-query";
import type { Page, Operations } from "@/lib/types";
import { Shell, Title, Pager, Empty } from "@/components/shell";
import { CorrectionReview } from "@/components/catalogue-editor";
import {
  AdminTools,
  RefundCompletion,
  SuppressContact,
} from "@/components/operations";
type RecordRow = {
  id: string;
  provider_id?: string;
  action?: string;
  created_at?: string;
  message?: string;
  title?: string;
  provider_name?: string;
  status?: string;
  amount_fils?: number;
  name?: string;
  phone_suffix?: string;
  marketing?: string;
  suppressed?: boolean;
  template?: string;
  details?: Record<string, unknown>;
  reference?: string;
  plan?: string;
  expires_at?: string;
};
export default async function PageScreen({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { actor, token } = await requireIdentity(
      "/admin/operations",
      "superadmin",
    ),
    query = await pageQuery(searchParams,["resource"]),
    resources = [
      "corrections",
      "audit",
      "refunds",
      "contacts",
      "campaigns",
      "subscriptions",
    ],
    resource = resources.includes(query.resource)
      ? query.resource
      : "corrections";
  const { resource: unused, ...paging } = query;
  void unused;
  const [data, operations] = await Promise.all([
    backend<Page<RecordRow>>(
      `/admin/lists/${resource}?${new URLSearchParams(paging)}`,
      token,
    ),
    backend<Operations>("/admin/operations", token),
  ]);
  return (
    <Shell actor={actor} role="admin">
      <Title
        title="Operations"
        note="Review corrections, audit history and development operations."
      />
      <nav className="status-tabs" aria-label="Operations sections">
        {resources.map((r) => (
          <Link
            key={r}
            aria-current={r === resource ? "page" : undefined}
            href={`/admin/operations?resource=${r}`}
          >
            {r[0].toUpperCase() + r.slice(1)}
          </Link>
        ))}
      </nav>
      {resource === "contacts" || resource === "campaigns" ? (
        <AdminTools resource={resource} />
      ) : null}
      <div className="stack section-gap">
        {data.items.map((row) => (
          <article className="record-card" key={row.id ?? row.provider_id}>
            <h3>
              {row.title ?? row.action ?? row.name ?? row.plan ?? "Refund"}
            </h3>
            {row.status && <span className="badge aqua">{row.status}</span>}
            {row.provider_name && (
              <p className="record-meta">{row.provider_name}</p>
            )}
            {row.message && <p className="record-meta">{row.message}</p>}
            {row.created_at && <p className="record-meta">{row.created_at}</p>}
            {row.amount_fils !== undefined && (
              <p className="record-meta">
                AED {(row.amount_fils / 100).toFixed(2)}
              </p>
            )}
            {row.details && (
              <p className="record-meta wrap-id">
                {JSON.stringify(row.details)}
              </p>
            )}
            {row.phone_suffix && (
              <p className="record-meta">
                Phone ending {row.phone_suffix} · {row.marketing} ·{" "}
                {row.suppressed ? "Suppressed" : "Not suppressed"}
              </p>
            )}
            {row.template && (
              <p className="record-meta">
                Template: {row.template} · Draft only
              </p>
            )}
            {resource === "corrections" && row.status === "pending" && (
              <details>
                <summary>Review correction</summary>
                <CorrectionReview id={row.id} />
              </details>
            )}
            {resource === "refunds" &&
              row.status === "pending" &&
              (operations.financeEnabled ? (
                <RefundCompletion id={row.id} />
              ) : (
                <p className="notice">
                  Finance completion is not enabled during development.
                </p>
              ))}
            {resource === "contacts" && !row.suppressed && (
              <SuppressContact id={row.id} />
            )}
          </article>
        ))}
      </div>
      {!data.total && (
        <Empty
          title="Nothing to review here"
          note="New records will appear as the platform is used."
        />
      )}
      <Pager
        data={data}
        query={{ ...paging, resource }}
        base="/admin/operations"
      />
    </Shell>
  );
}
