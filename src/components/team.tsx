"use client";
import { useRef, useState } from "react";
import type { Member, Page, Provider } from "@/lib/types";
import { request, errorMessage } from "@/lib/client-api";
import { MutationForm } from "./mutations";
export function Team({
  organizations,
}: {
  organizations: Page<Provider>;
}) {
  const [providers, setProviders] = useState(organizations),
    [providerId, setProviderId] = useState(""),
    [members, setMembers] = useState<Page<Member> | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [loadingProviders,setLoadingProviders] = useState(false);
  const memberRequest = useRef(0), providerRequest = useRef(0), chosen = useRef("");
  async function load(id: string, page = 1) {
    if(id !== chosen.current) return;
    const ticket = ++memberRequest.current;
    setMembers(null);
    setError("");
    if(!id) { setLoading(false); return; }
    setLoading(true);
    try {
      const result = await request<Page<Member>>(`/providers/${id}/members?page=${page}&pageSize=10`);
      if(ticket === memberRequest.current) setMembers(result);
    } catch(e) {
      if(ticket === memberRequest.current) setError(errorMessage(e));
    } finally { if(ticket === memberRequest.current) setLoading(false); }
  }
  async function providerPage(page: number) {
    const ticket = ++providerRequest.current;
    setLoadingProviders(true);
    setError("");
    try {
      const result = await request<Page<Provider>>(`/providers?owned=true&status=approved&page=${page}&pageSize=20`);
      if(ticket !== providerRequest.current) return;
      setProviders(result);
      setProviderId("");
      chosen.current = "";
      memberRequest.current++;
      setMembers(null);
      setLoading(false);
    } catch(e) {
      if(ticket === providerRequest.current) setError(errorMessage(e));
    } finally { if(ticket === providerRequest.current) setLoadingProviders(false); }
  }
  return (
    <div className="stack">
      <section className="panel form-stack">
        <label>
          Organization
          <select
            disabled={loadingProviders}
            value={providerId}
            onChange={(e) => {
              chosen.current = e.target.value;
              setProviderId(e.target.value);
              load(e.target.value);
            }}
          >
            <option value="">Choose an organization you own</option>
            {providers.items.map((p) => (
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
              disabled={loadingProviders}
              onClick={() => providerPage(providers.page - 1)}
            >
              Previous organizations
            </button>
          )}
          {providers.page < providers.pages && (
            <button
              className="btn outline small"
              disabled={loadingProviders}
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
      {!providers.total && <p className="notice">You do not own an approved organization. Staff access is managed by the organization owner.</p>}
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
                key={providerId}
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
                  disabled={loading}
                  onClick={() => load(providerId, members.page - 1)}
                >
                  Previous
                </button>
              )}
              {members.page < members.pages && (
                <button
                  className="btn outline small"
                  disabled={loading}
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
