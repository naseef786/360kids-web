"use client";
import { useEffect, useState } from "react";
import {
  api,
  auth,
  date,
  type Activity,
  type Child,
  type Profile,
} from "@/lib/client";
import { Form, type Field } from "./form";
function useResource<T>(endpoint: string | null, revision = 0) {
  const [resource, setResource] = useState<{
    endpoint: string;
    data: T | null;
    error: string;
  }>({ endpoint: "", data: null, error: "" });
  useEffect(() => {
    const controller = new AbortController();
    if (endpoint)
      void api<T>(endpoint, undefined, {
        signal: controller.signal,
        public: endpoint === "/content",
      })
        .then((d) => {
          if (!controller.signal.aborted)
            setResource({ endpoint, data: d, error: "" });
        })
        .catch((e) => {
          if (!controller.signal.aborted)
            setResource({
              endpoint,
              data: null,
              error: e instanceof Error ? e.message : "Unable to load.",
            });
        });
    return () => controller.abort();
  }, [endpoint, revision]);
  return resource.endpoint === endpoint
    ? {
        data: resource.data,
        error: resource.error,
        loading: !resource.data && !resource.error,
      }
    : { data: null, error: "", loading: Boolean(endpoint) };
}
const fieldsFor = (a: Activity): Field[] => [
  { name: "title", label: "Activity title", defaultValue: a.title },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    defaultValue: a.description,
  },
  { name: "category", label: "Category", defaultValue: a.category },
  { name: "area", label: "Area", defaultValue: a.area },
  {
    name: "minAge",
    label: "Minimum age",
    type: "number",
    defaultValue: a.min_age,
  },
  {
    name: "maxAge",
    label: "Maximum age",
    type: "number",
    defaultValue: a.max_age,
  },
  {
    name: "price",
    label: "Price per child (AED)",
    type: "number",
    defaultValue: a.price_fils / 100,
  },
  {
    name: "policy",
    label: "Cancellation policy",
    type: "textarea",
    defaultValue: a.policy,
  },
  {
    name: "publication",
    label: "Visibility",
    options: [
      { value: "false", label: "Draft / hidden" },
      { value: "true", label: "Published" },
    ],
    defaultValue: String(a.published),
  },
];
export function ActivityManager({
  activities,
  refresh,
}: {
  activities: Activity[];
  refresh: () => Promise<void>;
}) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Catalog management</p>
          <h2>Manage your listings</h2>
        </div>
        <span className="badge">{activities.length} listings</span>
      </div>
      {activities.length ? (
        activities.map((a) => (
          <details className="editor" key={a.id}>
            <summary>
              <span>{a.title}</span>
              <span className="badge">
                {a.published ? "Published" : "Draft"}
              </span>
            </summary>
            <p>
              Listing edits apply to future requests. Existing booking
              agreements retain their accepted details.
            </p>
            <Form
              key={a.version}
              fields={fieldsFor(a)}
              submit="Save listing"
              onSubmit={async (d) => {
                await api("/activities/" + a.id + "/update", {
                  title: d.title,
                  description: d.description,
                  category: d.category,
                  area: d.area,
                  minAge: Number(d.minAge),
                  maxAge: Number(d.maxAge),
                  priceFils: Math.round(Number(d.price) * 100),
                  policy: d.policy,
                  published: d.publication === "true",
                  version: a.version,
                });
                await refresh();
              }}
            />
            <h3>Scheduled sessions</h3>
            {a.sessions.map((s) => (
              <p key={s.id}>
                {date(s.starts_at)} · booking cutoff {date(s.cutoff_at)}
              </p>
            ))}
            <Form
              fields={[
                {
                  name: "startsAt",
                  label: "New session start (device timezone)",
                  type: "datetime-local",
                },
                {
                  name: "cutoffAt",
                  label: "Booking cutoff (device timezone)",
                  type: "datetime-local",
                },
                {
                  name: "capacity",
                  label: "Platform place allocation",
                  type: "number",
                },
              ]}
              submit="Add session"
              onSubmit={async (d) => {
                await api("/activities/" + a.id + "/sessions", {
                  startsAt: new Date(d.startsAt).toISOString(),
                  cutoffAt: new Date(d.cutoffAt).toISOString(),
                  capacity: Number(d.capacity),
                });
                await refresh();
              }}
            />
          </details>
        ))
      ) : (
        <p>Create your first listing below.</p>
      )}
    </section>
  );
}
export function ChildEditor({
  child,
  refresh,
}: {
  child: Child;
  refresh: () => Promise<void>;
}) {
  return (
    <details>
      <summary>Edit child profile</summary>
      <p className="muted">
        Active booking participants need a support review before profile
        changes.
      </p>
      <Form
        fields={[
          {
            name: "firstName",
            label: "First name",
            defaultValue: child.first_name,
          },
          { name: "surname", label: "Surname", defaultValue: child.surname },
          {
            name: "birthDate",
            label: "Date of birth",
            type: "date",
            defaultValue: child.birth_date.slice(0, 10),
          },
        ]}
        submit="Save child"
        onSubmit={async (d) => {
          await api("/children/" + child.id + "/update", d);
          await refresh();
        }}
      />
      <Form
        fields={[
          {
            name: "confirm",
            label: "Type ARCHIVE to remove this child from future requests",
          },
        ]}
        submit="Archive profile"
        onSubmit={async (d) => {
          if (d.confirm !== "ARCHIVE")
            throw new Error("Type ARCHIVE to confirm.");
          await api("/children/" + child.id + "/archive", {});
          await refresh();
        }}
      />
    </details>
  );
}
interface Ticket {
  id: string;
  topic: string;
  message: string;
  status: string;
  reply: string;
  created_at: string;
}
interface Correction {
  id: string;
  title: string;
  provider_name: string;
  message: string;
  status: string;
  review_note: string;
}
interface Content {
  slug: string;
  title: string;
  body: string;
  published: boolean;
  version: number;
}
export function BaseFeatures({
  path,
  profile,
  refresh,
  syncVersion = 0,
}: {
  syncVersion?: number;
  path: string;
  profile: Profile;
  refresh: () => Promise<void>;
}) {
  const [revision, setRevision] = useState(0);
  const update = async () => {
    setRevision((v) => v + 1);
    await refresh();
  };
  const support = path.endsWith("/support"),
    content = path === "/admin/content",
    corrections =
      path === "/admin/corrections" || path === "/provider/activities";
  const tickets = useResource<Ticket[]>(
      support ? "/support" : null,
      revision + syncVersion,
    ),
    pages = useResource<Content[]>(
      content ? "/manage/content" : null,
      revision + syncVersion,
    ),
    changes = useResource<Correction[]>(
      corrections ? "/corrections" : null,
      revision + syncVersion,
    );
  const [page, setPage] = useState("about");
  const current = pages.data?.find((p) => p.slug === page);
  return (
    <>
      {path === "/account/settings" && (
        <>
          <section className="panel">
            <p className="eyebrow">Personal details</p>
            <h2>Your account</h2>
            <p>{profile.email}</p>
            <Form
              fields={[
                {
                  name: "displayName",
                  label: "Your name",
                  defaultValue: profile.display_name || "",
                },
              ]}
              submit="Update profile"
              onSubmit={async (d) => {
                await api("/me", d);
                await refresh();
              }}
            />
          </section>
          <section className="panel">
            <h2>Account support</h2>
            <Recovery />
            <details>
              <summary>Request account deletion</summary>
              <p>
                Our team will review current bookings and required records
                before processing the request.
              </p>
              <Form
                fields={[
                  { name: "confirm", label: "Type DELETE to request a review" },
                ]}
                submit="Submit deletion request"
                onSubmit={async (d) => {
                  if (d.confirm !== "DELETE")
                    throw new Error("Type DELETE to confirm the request.");
                  await api("/me/deletion-request", {});
                }}
              />
            </details>
          </section>
        </>
      )}
      {support && (
        <>
          <p className="notice">
            Messages stay in your account. Please share only what the team needs
            to resolve your request.
          </p>
          {tickets.error && (
            <p role="alert" className="error">
              {tickets.error}
            </p>
          )}
          {tickets.loading ? (
            <p role="status">Loading support requests…</p>
          ) : tickets.data?.length ? (
            tickets.data.map((t) => (
              <article className="panel" key={t.id}>
                <div className="row">
                  <span className="badge">{t.status.replace("_", " ")}</span>
                  <small>{date(t.created_at)}</small>
                </div>
                <h3>{t.topic}</h3>
                <p className="prose">{t.message}</p>
                {t.reply && (
                  <div className="status-box">
                    <strong>Team response</strong>
                    <p>{t.reply}</p>
                  </div>
                )}
                {profile.role === "admin" && (
                  <Form
                    fields={[
                      {
                        name: "status",
                        label: "Status",
                        defaultValue: t.status,
                        options: ["open", "in_progress", "resolved"].map(
                          (value) => ({
                            value,
                            label: value.replace("_", " "),
                          }),
                        ),
                      },
                      {
                        name: "reply",
                        label: "Reply in account",
                        type: "textarea",
                        defaultValue: t.reply,
                      },
                    ]}
                    submit="Save response"
                    onSubmit={async (d) => {
                      await api("/support/" + t.id + "/reply", d);
                      await update();
                    }}
                  />
                )}
              </article>
            ))
          ) : !tickets.error ? (
            <div className="empty">
              <h3>No support requests</h3>
              <p>Your conversations will appear here.</p>
            </div>
          ) : null}
          <section className="panel">
            <h2>How can we help?</h2>
            <Form
              fields={[
                {
                  name: "topic",
                  label: "Topic",
                  options: [
                    "Booking",
                    "Child profile",
                    "Account",
                    "Provider application",
                    "Other",
                  ].map((value) => ({ value, label: value })),
                },
                { name: "message", label: "Your message", type: "textarea" },
              ]}
              submit="Send to support"
              onSubmit={async (d) => {
                await api("/support", d);
                await update();
              }}
            />
          </section>
        </>
      )}
      {content && (
        <section className="panel">
          <h2>Website page content</h2>
          <p>
            Publish reviewed content only. Text is displayed as plain text to
            protect visitors.
          </p>
          <label>
            Page
            <select value={page} onChange={(e) => setPage(e.target.value)}>
              {["about", "contact", "faq", "terms", "privacy"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          {pages.error && (
            <p className="error" role="alert">
              {pages.error}
            </p>
          )}
          <Form
            key={page + "-" + current?.version}
            fields={[
              {
                name: "title",
                label: "Page title",
                defaultValue: current?.title || "",
              },
              {
                name: "body",
                label: "Approved page content",
                type: "textarea",
                defaultValue: current?.body || "",
              },
              {
                name: "published",
                label: "Visibility",
                defaultValue: String(current?.published || false),
                options: [
                  { value: "false", label: "Keep as draft" },
                  { value: "true", label: "Publish" },
                ],
              },
            ]}
            submit="Save page"
            onSubmit={async (d) => {
              await api("/manage/content/" + page, {
                title: d.title,
                body: d.body,
                published: d.published === "true",
                version: current?.version || 1,
              });
              await update();
            }}
          />
        </section>
      )}
      {corrections && (
        <section className="panel">
          <h2>Content correction requests</h2>
          {changes.error && (
            <p role="alert" className="error">
              {changes.error}
            </p>
          )}
          {changes.loading ? (
            <p role="status">Loading correction requests…</p>
          ) : changes.data?.length ? (
            changes.data.map((c) => (
              <article className="review-item" key={c.id}>
                <span className="badge">{c.status}</span>
                <h3>{c.title}</h3>
                <small>{c.provider_name}</small>
                <p className="prose">{c.message}</p>
                {c.review_note && <p className="notice">{c.review_note}</p>}
                {profile.role === "admin" && c.status === "pending" && (
                  <>
                    <p>
                      Edit the listing under Activities first, then record the
                      review outcome here.
                    </p>
                    <Form
                      fields={[
                        {
                          name: "status",
                          label: "Decision",
                          options: [
                            { value: "resolved", label: "Applied to listing" },
                            { value: "rejected", label: "Not approved" },
                          ],
                        },
                        {
                          name: "note",
                          label: "Review explanation",
                          type: "textarea",
                        },
                      ]}
                      submit="Complete review"
                      onSubmit={async (d) => {
                        await api("/corrections/" + c.id + "/review", d);
                        await update();
                      }}
                    />
                  </>
                )}
              </article>
            ))
          ) : !changes.error ? (
            <p>No correction requests yet.</p>
          ) : null}
        </section>
      )}
    </>
  );
}
export function Recovery({ reset = false }: { reset?: boolean }) {
  const fields: Field[] = reset
    ? [
        {
          name: "password",
          label: "New password (at least 12 characters)",
          type: "password",
        },
      ]
    : [{ name: "email", label: "Account email", type: "email" }];
  return (
    <details open={reset}>
      <summary>
        {reset ? "Choose a new password" : "Forgot your password?"}
      </summary>
      <Form
        fields={fields}
        successMessage={
          reset
            ? "Your password has been updated."
            : "If your account is eligible, check your inbox for a recovery link."
        }
        submit={reset ? "Update password" : "Send recovery link"}
        onSubmit={async (d) => {
          if (!auth)
            throw new Error("Account service has not been configured.");
          if (reset) {
            if (d.password.length < 12)
              throw new Error("Use at least 12 characters.");
            const { error } = await auth.auth.updateUser({
              password: d.password,
            });
            if (error) throw error;
          } else {
            const { error } = await auth.auth.resetPasswordForEmail(d.email, {
              redirectTo: window.location.origin + "/reset-password",
            });
            if (error) throw error;
          }
        }}
      />
    </details>
  );
}
export function PublicContent({ slug }: { slug: string }) {
  const { data, error, loading } = useResource<Content[]>("/content");
  const page = data?.find((p) => p.slug === slug);
  return (
    <section className="auth-card">
      <p className="eyebrow">360 Kids Activity</p>
      <h1>{page?.title || slug[0].toUpperCase() + slug.slice(1)}</h1>
      {loading ? (
        <p role="status">Loading page content…</p>
      ) : error ? (
        <p role="alert" className="error">
          {error}
        </p>
      ) : page ? (
        <div className="prose content-copy">{page.body}</div>
      ) : (
        <div className="empty">
          <h3>Page content is being prepared</h3>
          <p>Reviewed information will be published here by the team.</p>
        </div>
      )}
    </section>
  );
}
export function BookingHistory({
  id,
  version = 0,
}: {
  id: string;
  version?: number;
}) {
  const [open, setOpen] = useState(false);
  const { data, error } = useResource<{ action: string; created_at: string }[]>(
    open ? "/bookings/" + id + "/history" : null,
    version,
  );
  return (
    <details onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>Booking timeline</summary>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <ol className="timeline">
        {data?.map((h, i) => (
          <li key={i}>
            <strong>
              {h.action.replaceAll(".", " ").replaceAll("_", " ")}
            </strong>
            <small>{date(h.created_at)}</small>
          </li>
        ))}
      </ol>
    </details>
  );
}
