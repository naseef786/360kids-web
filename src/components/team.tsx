"use client";
import { useRef, useState } from "react";
import type { Branch, BranchRole, Member, Page, Provider } from "@/lib/types";
import { request, errorMessage } from "@/lib/client-api";
import { MutationForm } from "./mutations";

export function Team({
  organizations,
}: {
  organizations: Page<Provider>;
}) {
  const [providers, setProviders] = useState(organizations),
    [providerId, setProviderId] = useState(""),
    [tab, setTab] = useState<"members" | "branches">("members"),
    [members, setMembers] = useState<Page<Member> | null>(null),
    [branches, setBranches] = useState<Page<Branch> | null>(null),
    [selectedBranchId, setSelectedBranchId] = useState(""),
    [branchRoles, setBranchRoles] = useState<Page<BranchRole> | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [loadingBranches, setLoadingBranches] = useState(false),
    [loadingRoles, setLoadingRoles] = useState(false),
    [loadingProviders, setLoadingProviders] = useState(false);

  const memberRequest = useRef(0),
    branchRequest = useRef(0),
    roleRequest = useRef(0),
    providerRequest = useRef(0),
    chosen = useRef("");

  async function load(id: string, page = 1) {
    if (id !== chosen.current) return;
    const ticket = ++memberRequest.current;
    setMembers(null);
    setError("");
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await request<Page<Member>>(
        `/providers/${id}/members?page=${page}&pageSize=10`,
      );
      if (ticket === memberRequest.current) setMembers(result);
    } catch (e) {
      if (ticket === memberRequest.current) setError(errorMessage(e));
    } finally {
      if (ticket === memberRequest.current) setLoading(false);
    }
  }

  async function loadBranches(id: string, page = 1) {
    if (id !== chosen.current) return;
    const ticket = ++branchRequest.current;
    setBranches(null);
    setSelectedBranchId("");
    setBranchRoles(null);
    if (!id) return;
    setLoadingBranches(true);
    try {
      const result = await request<Page<Branch>>(
        `/providers/${id}/branches?page=${page}&pageSize=20`,
      );
      if (ticket === branchRequest.current) {
        setBranches(result);
        if (result.items.length > 0 && !selectedBranchId) {
          setSelectedBranchId(result.items[0].id);
          void loadRoles(id, result.items[0].id);
        }
      }
    } catch (e) {
      if (ticket === branchRequest.current) setError(errorMessage(e));
    } finally {
      if (ticket === branchRequest.current) setLoadingBranches(false);
    }
  }

  async function loadRoles(id: string, branchId: string, page = 1) {
    const ticket = ++roleRequest.current;
    setBranchRoles(null);
    if (!id || !branchId) return;
    setLoadingRoles(true);
    try {
      const result = await request<Page<BranchRole>>(
        `/providers/${id}/branches/${branchId}/roles?page=${page}&pageSize=20`,
      );
      if (ticket === roleRequest.current) setBranchRoles(result);
    } catch (e) {
      if (ticket === roleRequest.current) setError(errorMessage(e));
    } finally {
      if (ticket === roleRequest.current) setLoadingRoles(false);
    }
  }

  async function providerPage(page: number) {
    const ticket = ++providerRequest.current;
    setLoadingProviders(true);
    setError("");
    try {
      const result = await request<Page<Provider>>(
        `/providers?owned=true&status=approved&page=${page}&pageSize=20`,
      );
      if (ticket !== providerRequest.current) return;
      setProviders(result);
      setProviderId("");
      chosen.current = "";
      memberRequest.current++;
      branchRequest.current++;
      setMembers(null);
      setBranches(null);
      setSelectedBranchId("");
      setBranchRoles(null);
      setLoading(false);
    } catch (e) {
      if (ticket === providerRequest.current) setError(errorMessage(e));
    } finally {
      if (ticket === providerRequest.current) setLoadingProviders(false);
    }
  }

  const activeStaff =
    members?.items.filter((m) => m.role === "staff" && m.active) ?? [];

  return (
    <div className="stack">
      <section className="panel form-stack">
        <label>
          Organization
          <select
            disabled={loadingProviders}
            value={providerId}
            onChange={(e) => {
              const id = e.target.value;
              chosen.current = id;
              setProviderId(id);
              if (id) {
                void load(id);
                void loadBranches(id);
              } else {
                setMembers(null);
                setBranches(null);
                setBranchRoles(null);
                setSelectedBranchId("");
              }
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
              type="button"
              className="btn outline small"
              disabled={loadingProviders}
              onClick={() => providerPage(providers.page - 1)}
            >
              Previous organizations
            </button>
          )}
          {providers.page < providers.pages && (
            <button
              type="button"
              className="btn outline small"
              disabled={loadingProviders}
              onClick={() => providerPage(providers.page + 1)}
            >
              More organizations
            </button>
          )}
        </div>
        <p className="fine-print">
          Only organization owners can manage team access and branches. Staff
          accounts must already exist.
        </p>
      </section>

      {!providers.total && (
        <p className="notice">
          You do not own an approved organization. Staff access is managed by
          the organization owner.
        </p>
      )}

      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}

      {providerId && (
        <div className="status-tabs" role="tablist" aria-label="Team view tabs">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "members"}
            className={`btn small ${tab === "members" ? "" : "outline"}`}
            onClick={() => setTab("members")}
          >
            Staff members ({members?.total ?? 0})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "branches"}
            className={`btn small ${tab === "branches" ? "" : "outline"}`}
            onClick={() => setTab("branches")}
          >
            Branches & roles ({branches?.total ?? 0})
          </button>
        </div>
      )}

      {providerId && tab === "members" && (
        <>
          {loading && <p role="status">Loading team…</p>}
          <section className="panel">
            <h2>Add or reactivate staff</h2>
            <div className="section-gap">
              <MutationForm
                key={providerId}
                label="Grant staff access"
                onSuccess={() => {
                  void load(providerId);
                  void loadBranches(providerId);
                }}
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

          {members && (
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
                      onSuccess={() => void load(providerId, members.page)}
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

              <nav className="pagination" aria-label="Team pagination">
                <span>
                  {members.total} members · Page {members.page} of{" "}
                  {Math.max(1, members.pages)}
                </span>
                <div>
                  {members.page > 1 && (
                    <button
                      type="button"
                      className="btn outline small"
                      disabled={loading}
                      onClick={() => void load(providerId, members.page - 1)}
                    >
                      Previous
                    </button>
                  )}
                  {members.page < members.pages && (
                    <button
                      type="button"
                      className="btn outline small"
                      disabled={loading}
                      onClick={() => void load(providerId, members.page + 1)}
                    >
                      Next
                    </button>
                  )}
                </div>
              </nav>
            </div>
          )}
        </>
      )}

      {providerId && tab === "branches" && (
        <>
          {loadingBranches && <p role="status">Loading branches…</p>}
          <section className="panel">
            <h2>Add a branch</h2>
            <div className="section-gap">
              <MutationForm
                key={`branch-${providerId}`}
                label="Create branch"
                onSuccess={() => void loadBranches(providerId)}
                reset
                submit={(data) =>
                  request(`/providers/${providerId}/branches`, "POST", {
                    name: String(data.get("name")),
                  })
                }
              >
                <label>
                  Branch name
                  <input
                    name="name"
                    placeholder="e.g. Dubai Marina Branch"
                    required
                    maxLength={200}
                  />
                </label>
              </MutationForm>
            </div>
          </section>

          {branches && (
            <div className="stack">
              <h2>Branches ({branches.total})</h2>
              {branches.items.map((branch) => (
                <section
                  className={`record-card ${selectedBranchId === branch.id ? "panel-selected" : ""}`}
                  key={branch.id}
                >
                  <div className="section-heading">
                    <div>
                      <h3>{branch.name}</h3>
                      <p className="record-meta">
                        {branch.active ? "Active branch" : "Inactive branch"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`btn small ${selectedBranchId === branch.id ? "" : "outline"}`}
                      onClick={() => {
                        setSelectedBranchId(branch.id);
                        void loadRoles(providerId, branch.id);
                      }}
                    >
                      {selectedBranchId === branch.id
                        ? "Selected"
                        : "Manage roles"}
                    </button>
                  </div>
                </section>
              ))}

              {selectedBranchId && (
                <section className="panel section-gap">
                  <h2>Assign branch role</h2>
                  <p className="fine-print">
                    Assign an active staff member to manage this branch or
                    handle its booking requests.
                  </p>
                  {activeStaff.length === 0 ? (
                    <p className="notice">
                      No active staff members found. Add or reactivate staff in
                      the Staff Members tab first.
                    </p>
                  ) : (
                    <div className="section-gap">
                      <MutationForm
                        key={`assign-${selectedBranchId}`}
                        label="Assign role"
                        onSuccess={() =>
                          void loadRoles(providerId, selectedBranchId)
                        }
                        reset
                        submit={(data) =>
                          request(
                            `/providers/${providerId}/branches/${selectedBranchId}/roles`,
                            "PUT",
                            {
                              userId: String(data.get("userId")),
                              role: String(data.get("role")),
                              active: true,
                            },
                          )
                        }
                      >
                        <div className="form-grid">
                          <label>
                            Staff member
                            <select name="userId" required>
                              <option value="">Select active staff</option>
                              {activeStaff.map((s) => (
                                <option value={s.user_id} key={s.user_id}>
                                  {s.email}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Role
                            <select name="role" required>
                              <option value="booking_staff">
                                Booking staff (handle requests)
                              </option>
                              <option value="branch_manager">
                                Branch manager
                              </option>
                              <option value="content_staff">
                                Content staff
                              </option>
                            </select>
                          </label>
                        </div>
                      </MutationForm>
                    </div>
                  )}

                  <h3 className="section-gap">Current branch roles</h3>
                  {loadingRoles && <p role="status">Loading roles…</p>}
                  {branchRoles && branchRoles.items.length === 0 && (
                    <p className="record-meta">
                      No roles assigned for this branch yet.
                    </p>
                  )}
                  {branchRoles && (
                    <div className="stack section-gap">
                      {branchRoles.items.map((r) => (
                        <div
                          className="child-row"
                          key={`${r.user_id}-${r.role}`}
                        >
                          <div>
                            <b>{r.email}</b>
                            <p className="record-meta">
                              {r.role.replace("_", " ")} ·{" "}
                              {r.active ? "Active" : "Inactive"}
                            </p>
                          </div>
                          <MutationForm
                            label={r.active ? "Deactivate" : "Activate"}
                            onSuccess={() =>
                              void loadRoles(providerId, selectedBranchId)
                            }
                            submit={() =>
                              request(
                                `/providers/${providerId}/branches/${selectedBranchId}/roles`,
                                "PUT",
                                {
                                  userId: r.user_id,
                                  role: r.role,
                                  active: !r.active,
                                },
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
