"use client";
import { useState } from "react";
import type { Member, Page, Provider } from "@/lib/types";
import { request, errorMessage } from "@/lib/client-api";
import { MutationForm } from "./mutations";
export function Team({
  organizations,
  accountId,
}: {
  organizations: Page<Provider>;
  accountId: string;
}) {
  const [providers, setProviders] = useState(organizations),
    [providerId, setProviderId] = useState(""),
    [members, setMembers] = useState<Page<Member> | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  async function load(id: string, page = 1) {
    setLoading(true);
    setError("");
    try {
      setMembers(
        await request(`/providers/${id}/members?page=${page}&pageSize=10`),
      );
    } catch (e) {
      setMembers(null);
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }
  async function providerPage(page: number) {
    try {
      setProviders(
        await request(
          `/providers?owned=true&status=approved&page=${page}&pageSize=20`,
        ),
      );
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <div className="stack">
      <section className="panel form-stack">
        <label>
          Organization
          <select
            value={providerId}
            onChange={(e) => {
              setProviderId(e.target.value);
              load(e.target.value);
            }}
          >
            <option value="">Choose an organization you own</option>
            {providers.items
              .filter(
                (p) => p.owner_id === accountId && p.status === "approved",
              )
              .map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
        <div className="card-actions">
          {providers.page > 1 && (
            <button
              className="btn outline small"
              onClick={() => providerPage(providers.page - 1)}
            >
              Previous organizations
            </button>
          )}
          {providers.page < providers.pages && (
            <button
              className="btn outline small"
              onClick={() => providerPage(providers.page + 1)}
            >
              More organizations
            </button>
          )}
        </div>
        <p className="fine-print">
          Only organization owners can manage team access. Staff accounts must
          already exist.
        </p>
      </section>
      {loading && <p role="status">Loading team…</p>}
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {members && providerId && (
        <>
          <section className="panel">
            <h2>Add or reactivate staff</h2>
            <div className="section-gap">
              <MutationForm
                label="Grant staff access"
                onSuccess={() => load(providerId)}
                reset
                submit={(data) =>
                  request(`/providers/${providerId}/members`, "POST", {
                    userId: data.get("userId"),
                    role: "staff",
                    active: true,
                  })
                }
              >
                <label>
                  Existing account ID
                  <input
                    name="userId"
                    placeholder="Account ID from their profile"
                    required
                    pattern="[0-9a-fA-F-]{36}"
                  />
                </label>
              </MutationForm>
            </div>
          </section>
          <div className="stack">
            {members.items.map((member) => (
              <section className="record-card" key={member.user_id}>
                <h3>{member.email}</h3>
                <p className="record-meta">
                  {member.role} · {member.active ? "Active" : "Suspended"}
                </p>
                {member.role !== "owner" && (
                  <MutationForm
                    label={
                      member.active ? "Suspend access" : "Reactivate access"
                    }
                    onSuccess={() => load(providerId, members.page)}
                    submit={() =>
                      request(`/providers/${providerId}/members`, "POST", {
                        userId: member.user_id,
                        role: "staff",
                        active: !member.active,
                      })
                    }
                  >
                    <p className="fine-print">
                      Changes take effect on the next request.
                    </p>
                  </MutationForm>
                )}
              </section>
            ))}
          </div>
          <nav className="pagination" aria-label="Team pagination">
            <span>
              {members.total} members · Page {members.page} of{" "}
              {Math.max(1, members.pages)}
            </span>
            <div>
              {members.page > 1 && (
                <button
                  className="btn outline small"
                  onClick={() => load(providerId, members.page - 1)}
                >
                  Previous
                </button>
              )}
              {members.page < members.pages && (
                <button
                  className="btn outline small"
                  onClick={() => load(providerId, members.page + 1)}
                >
                  Next
                </button>
              )}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
