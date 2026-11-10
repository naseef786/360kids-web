"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { request, errorMessage } from "@/lib/client-api";
import type {
  Activity,
  Booking,
  Child,
  Page,
  Provider,
  Session,
} from "@/lib/types";
import { money, dateTime } from "@/lib/types";
export function MutationForm({
  children,
  submit,
  onSuccess,
  reset = false,
  label = "Save",
  className = "form-stack",
}: {
  children: React.ReactNode;
  submit: (data: FormData, key: string) => Promise<unknown>;
  onSuccess?: () => void;
  reset?: boolean;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(false);
  const retry = useRef<{ fingerprint: string; key: string } | null>(null);
  async function handle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      data = new FormData(form),
      fingerprint = JSON.stringify([...data]);
    if (retry.current?.fingerprint !== fingerprint)
      retry.current = { fingerprint, key: crypto.randomUUID() };
    setPending(true);
    setError("");
    setSuccess(false);
    try {
      await submit(data, retry.current!.key);
      retry.current = null;
      if (reset) form.reset();
      setSuccess(true);
      router.refresh();
      onSuccess?.();
    } catch (e) {
      setError(errorMessage(e));
      router.refresh();
    } finally {
      setPending(false);
    }
  }
  return (
    <form className={className} onSubmit={handle}>
      <fieldset disabled={pending} className="form-fields">
        {children}
      </fieldset>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="notice success" role="status">
          Saved successfully.
        </p>
      )}
      <button className="btn" disabled={pending}>
        {pending ? "Saving…" : label}
      </button>
    </form>
  );
}
export function SaveButton({
  id,
  initial = false,
}: {
  id: string;
  initial?: boolean;
}) {
  const [saved, setSaved] = useState(initial),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const router = useRouter();
  return (
    <div>
      <button
        className="btn outline small"
        disabled={pending}
        aria-pressed={saved}
        onClick={async () => {
          setPending(true);
          setError("");
          try {
            await request(`/saved/${id}`, "PUT", { saved: !saved });
            setSaved(!saved);
            router.refresh();
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Saving…" : saved ? "Remove saved" : "Save activity"}
      </button>
      {error && (
        <p role="alert" className="notice error">
          {error} <Link href="/login">Sign in</Link>
        </p>
      )}
    </div>
  );
}
export function ChildEditor({ child }: { child?: Child }) {
  const [mode, setMode] = useState(
    child?.birth_date ? "birthDate" : "ageYears",
  );
  return (
    <MutationForm
      label={child ? "Update child" : "Add child"}
      reset={!child}
      submit={(data) =>
        request(
          child ? `/children/${child.id}` : "/children",
          child ? "PUT" : "POST",
          {
            firstName: data.get("firstName"),
            surname: data.get("surname") || undefined,
            ...(mode === "birthDate"
              ? { birthDate: data.get("birthDate") }
              : { ageYears: Number(data.get("ageYears")) }),
          },
        )
      }
    >
      <div className="form-grid">
        <label>
          Preferred first name
          <input
            name="firstName"
            defaultValue={child?.first_name}
            required
            maxLength={200}
          />
        </label>
        <label>
          Surname (optional)
          <input name="surname" defaultValue={child?.surname} maxLength={200} />
        </label>
        <label>
          Age information
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value)}
          >
            <option value="ageYears">Age in years</option>
            <option value="birthDate">Exact birth date</option>
          </select>
        </label>
        {mode === "ageYears" ? (
          <label>
            Age in years
            <input
              name="ageYears"
              type="number"
              min={0}
              max={17}
              defaultValue={child?.age_years ?? undefined}
              required
            />
          </label>
        ) : (
          <label>
            Birth date
            <input
              name="birthDate"
              type="date"
              max={new Intl.DateTimeFormat("en-CA", {
                timeZone: "Asia/Dubai",
              }).format(new Date())}
              defaultValue={child?.birth_date?.slice(0, 10)}
              required
            />
          </label>
        )}
      </div>
      <p className="fine-print">
        Age alone is enough for most activities. We’ll ask for an exact birth
        date if eligibility is uncertain.
      </p>
    </MutationForm>
  );
}
export function BookingRequest({
  activity,
  childrenPage,
  sessionsPage,
  signedIn,
}: {
  activity: Activity;
  childrenPage: Page<Child> | null;
  sessionsPage: Page<Session>;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [children, setChildren] = useState(childrenPage),
    [selected, setSelected] = useState<string[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [sessionPage, setSessionPage] = useState(sessionsPage),
    [sessionId, setSessionId] = useState("");
  const sessions = sessionPage.items;
  async function loadSessions(page: number) {
    setLoading(true);
    setError("");
    try {
      setSessionPage(
        await request(
          `/activities/${activity.id}/sessions?page=${page}&pageSize=10`,
        ),
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }
  if (!signedIn)
    return (
      <aside className="panel booking-form">
        <h2>Make room for discovery</h2>
        <p className="record-meta">
          Sign in to choose your children and request a place.
        </p>
        <Link className="btn" href={`/login?next=/activities/${activity.id}`}>
          Sign in to request
        </Link>
      </aside>
    );
  async function childPage(page: number) {
    setLoading(true);
    setError("");
    try {
      setChildren(await request(`/children?page=${page}&pageSize=10`));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }
  return (
    <aside className="panel booking-form">
      <h2>Request a place</h2>
      <p className="record-meta">From {money(activity.price_fils)} per child</p>
      {!sessions.length ? (
        <p className="notice">No sessions are currently accepting requests.</p>
      ) : !children?.total ? (
        <>
          <p className="notice">
            Add a fictional child profile to try this activity.
          </p>
          <Link className="btn" href="/parent/profile">
            Add a child
          </Link>
        </>
      ) : (
        <MutationForm
          label="Send booking request"
          onSuccess={() => {
            router.push("/parent/bookings");
          }}
          submit={(data, key) => {
            if (!selected.length) throw new Error("Choose at least one child.");
            return request(
              "/bookings",
              "POST",
              {
                sessionId: data.get("sessionId"),
                childIds: selected,
                policyAccepted: data.get("policyAccepted") === "on",
              },
              key,
            );
          }}
        >
          <label>
            Choose a session
            <select
              name="sessionId"
              required
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
            >
              <option value="" disabled>
                Select date and time
              </option>
              {sessions.map((s) => (
                <option
                  key={s.id}
                  value={s.id}
                  disabled={s.capacity - s.allocated < 1}
                >
                  {dateTime(s.starts_at)} ·{" "}
                  {Math.max(0, s.capacity - s.allocated)} places
                </option>
              ))}
            </select>
          </label>
          <div className="card-actions">
            {sessionPage.page > 1 && (
              <button
                type="button"
                className="btn outline small"
                disabled={loading}
                onClick={() => {
                  setSessionId("");
                  loadSessions(sessionPage.page - 1);
                }}
              >
                Previous sessions
              </button>
            )}
            {sessionPage.page < sessionPage.pages && (
              <button
                type="button"
                className="btn outline small"
                disabled={loading}
                onClick={() => {
                  setSessionId("");
                  loadSessions(sessionPage.page + 1);
                }}
              >
                More sessions
              </button>
            )}
          </div>
          <div>
            <h3>Who’s joining?</h3>
            <p className="fine-print">
              {selected.length} selected · Up to 10 children per request.
            </p>
            <div className="check-list">
              {children.items.map((child) => (
                <label className="check-row" key={child.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(child.id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, child.id]
                          : selected.filter((id) => id !== child.id),
                      )
                    }
                    disabled={
                      !selected.includes(child.id) && selected.length >= 10
                    }
                  />
                  <span>{child.first_name}</span>
                </label>
              ))}
            </div>
            <div className="card-actions">
              {children.page > 1 && (
                <button
                  type="button"
                  className="btn outline small"
                  disabled={loading}
                  onClick={() => childPage(children.page - 1)}
                >
                  Previous children
                </button>
              )}
              {children.page < children.pages && (
                <button
                  type="button"
                  className="btn outline small"
                  disabled={loading}
                  onClick={() => childPage(children.page + 1)}
                >
                  More children
                </button>
              )}
            </div>
            {error && (
              <p className="notice error" role="alert">
                {error}
              </p>
            )}
          </div>
          <p>
            <strong>
              Estimated total: {money(activity.price_fils * selected.length)}
            </strong>
          </p>
          <p className="fine-print">
            The provider reviews your request. Sending it does not reserve or
            confirm a place.
          </p>
          <details>
            <summary>Cancellation policy</summary>
            <p className="details-policy">{activity.policy}</p>
          </details>
          <label className="check-row">
            <input type="checkbox" name="policyAccepted" required />
            <span>I accept this activity’s cancellation policy.</span>
          </label>
        </MutationForm>
      )}
    </aside>
  );
}
export function BookingActions({
  booking,
  mode,
  finance = false,
}: {
  booking: Booking;
  mode: "parent" | "partner" | "admin";
  finance?: boolean;
}) {
  const active = !["CANCELLED", "EXPIRED", "DECLINED"].includes(booking.state);
  const provider = mode !== "parent";
  const submit = (action: string) => (data: FormData, key: string) =>
    request(
      `/bookings/${booking.id}/actions`,
      "POST",
      {
        action,
        version: booking.version,
        reason: data.get("reason") || undefined,
        reference: data.get("reference") || undefined,
        ...(action === "offer"
          ? { amountFils: Math.round(Number(data.get("amount")) * 100) }
          : {}),
      },
      key,
    );
  return (
    <div className="stack section-gap">
      {provider && booking.state === "REQUESTED" && (
        <>
          <MutationForm label="Accept request" submit={submit("accept")}>
            <p className="fine-print">
              Accepting holds places until the payment deadline. The booking
              remains unconfirmed.
            </p>
          </MutationForm>
          <details>
            <summary>Propose a different total</summary>
            <MutationForm label="Send offer" submit={submit("offer")}>
              <label>
                Total for all children (AED)
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={1000000}
                  required
                />
              </label>
              <label>
                Offer note
                <textarea
                  name="reason"
                  minLength={1}
                  maxLength={2000}
                  required
                />
              </label>
            </MutationForm>
          </details>
        </>
      )}
      {provider && ["REQUESTED", "OFFER_PENDING"].includes(booking.state) && (
        <details>
          <summary>Decline request</summary>
          <MutationForm label="Decline request" submit={submit("decline")}>
            <label>
              Reason
              <textarea name="reason" required maxLength={2000} />
            </label>
          </MutationForm>
        </details>
      )}
      {mode === "parent" && booking.state === "OFFER_PENDING" && (
        <MutationForm
          label={`Accept offer · ${money(booking.offer?.amountFils ?? booking.amount_fils)}`}
          submit={submit("accept-offer")}
        >
          <p className="fine-print">
            Accept the revised total and proceed to the payment stage.
          </p>
        </MutationForm>
      )}
      {booking.state === "PAYMENT_DUE" && (
        <p className="notice">
          {finance
            ? "Payment is due by the deadline below."
            : "Payment collection is not enabled during development. No money should be transferred."}
        </p>
      )}
      {mode === "parent" && finance && booking.state === "PAYMENT_DUE" && (
        <MutationForm label="Submit reference" submit={submit("proof")}>
          <label>
            Payment reference
            <input name="reference" minLength={3} maxLength={200} required />
          </label>
        </MutationForm>
      )}
      {mode === "admin" && finance && booking.state === "PAYMENT_CHECKING" && (
        <MutationForm label="Verify payment" submit={submit("verify")}>
          <p className="fine-print">
            Only verify after checking the payment against the agreed collection
            process.
          </p>
        </MutationForm>
      )}
      {active &&
        (provider ||
          !["CONFIRMED", "PAYMENT_CHECKING"].includes(booking.state)) && (
          <details>
            <summary>Cancel this request</summary>
            <MutationForm label="Cancel request" submit={submit("cancel")}>
              <label>
                Cancellation reason
                <textarea
                  name="reason"
                  minLength={1}
                  maxLength={2000}
                  required
                />
              </label>
            </MutationForm>
          </details>
        )}
    </div>
  );
}
export function ProviderApplication() {
  return (
    <MutationForm
      label="Submit partner application"
      reset
      submit={(data) =>
        request("/providers", "POST", {
          name: data.get("name"),
          description: data.get("description"),
        })
      }
    >
      <label>
        Organization name
        <input name="name" required maxLength={200} />
      </label>
      <label>
        About your organization
        <textarea name="description" minLength={10} maxLength={4000} required />
      </label>
      <p className="fine-print">
        The platform team reviews your application before partner access becomes
        available.
      </p>
    </MutationForm>
  );
}
export function ProviderReview({ provider }: { provider: Provider }) {
  return (
    <MutationForm
      label="Save review decision"
      submit={(data) =>
        request(`/providers/${provider.id}/review`, "POST", {
          status: data.get("status"),
          reason: data.get("reason") || undefined,
        })
      }
    >
      <label>
        Decision
        <select name="status" defaultValue="approved">
          <option value="approved">Approve</option>
          <option value="rejected">Reject</option>
          <option value="suspended">Suspend</option>
        </select>
      </label>
      <label>
        Review reason
        <textarea
          name="reason"
          maxLength={2000}
          placeholder="Required when rejecting or suspending"
        />
      </label>
    </MutationForm>
  );
}
export function Publication({ activity }: { activity: Activity }) {
  return (
    <MutationForm
      label={activity.published ? "Unpublish activity" : "Publish activity"}
      submit={() =>
        request(`/activities/${activity.id}/publication`, "PUT", {
          published: !activity.published,
        })
      }
    >
      <p className="fine-print">
        {activity.published
          ? "Remove this activity from public discovery. Existing bookings remain."
          : "Publish only after checking the activity, policy and provider."}
      </p>
    </MutationForm>
  );
}
export function CorrectionForm({ activity }: { activity: Activity }) {
  return (
    <MutationForm
      label="Submit correction"
      reset
      submit={(data) =>
        request(`/activities/${activity.id}/corrections`, "POST", {
          message: data.get("message"),
        })
      }
    >
      <label>
        Requested correction
        <textarea name="message" minLength={10} maxLength={4000} required />
      </label>
    </MutationForm>
  );
}
export function ActivityForm({
  providers,
  admin = false,
}: {
  providers: Page<Provider>;
  admin?: boolean;
}) {
  const [page, setPage] = useState(providers),
    [error, setError] = useState(""),
    [selected, setSelected] = useState("");
  async function load(pageNumber: number) {
    try {
      setPage(
        await request(
          `/providers?status=approved&page=${pageNumber}&pageSize=20`,
        ),
      );
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <MutationForm
      label={admin ? "Create activity" : "Submit activity for review"}
      reset
      submit={(data) =>
        request("/activities", "POST", {
          providerId: selected,
          title: data.get("title"),
          description: data.get("description"),
          category: data.get("category"),
          area: data.get("area"),
          minAge: Number(data.get("minAge")),
          maxAge: Number(data.get("maxAge")),
          priceFils: Math.round(Number(data.get("price")) * 100),
          policy: data.get("policy"),
          published: admin && data.get("published") === "on",
          startsAt: new Date(
            String(data.get("startsAt")) + "+04:00",
          ).toISOString(),
          cutoffAt: new Date(
            String(data.get("cutoffAt")) + "+04:00",
          ).toISOString(),
          capacity: Number(data.get("capacity")),
        })
      }
    >
      <div className="form-grid">
        <label className="wide">
          Provider organization
          <select
            name="providerId"
            required
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Choose an approved provider</option>
            {page.items
              .filter((p) => p.status === "approved")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
        {page.pages > 1 && (
          <div className="card-actions wide">
            {page.page > 1 && (
              <button
                type="button"
                className="btn outline small"
                onClick={() => load(page.page - 1)}
              >
                Previous organizations
              </button>
            )}
            {page.page < page.pages && (
              <button
                type="button"
                className="btn outline small"
                onClick={() => load(page.page + 1)}
              >
                More organizations
              </button>
            )}
            <span className="list-count">
              Page {page.page} of {page.pages}
            </span>
          </div>
        )}
        {error && (
          <p className="notice error wide" role="alert">
            {error}
          </p>
        )}
        <label className="wide">
          Activity title
          <input name="title" required maxLength={200} />
        </label>
        <label className="wide">
          Description
          <textarea
            name="description"
            minLength={10}
            maxLength={8000}
            required
          />
        </label>
        <label>
          Category
          <select name="category">
            {[
              "Indoor play",
              "Outdoors",
              "Sports",
              "Arts",
              "Music",
              "Learning",
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Area
          <input name="area" required maxLength={200} />
        </label>
        <label>
          Minimum age
          <input name="minAge" type="number" min={0} max={18} required />
        </label>
        <label>
          Maximum age
          <input name="maxAge" type="number" min={0} max={18} required />
        </label>
        <label>
          Price per child (AED)
          <input
            name="price"
            type="number"
            step="0.01"
            min="0.01"
            max={100000}
            required
          />
        </label>
        <label>
          Places available
          <input name="capacity" type="number" min={1} max={10000} required />
        </label>
        <label>
          Session starts (Dubai time)
          <input name="startsAt" type="datetime-local" required />
        </label>
        <label>
          Request cutoff (Dubai time)
          <input name="cutoffAt" type="datetime-local" required />
        </label>
        <label className="wide">
          Cancellation policy
          <textarea name="policy" minLength={10} maxLength={8000} required />
        </label>
        {admin && (
          <label className="check-row wide">
            <input type="checkbox" name="published" />
            <span>Publish immediately</span>
          </label>
        )}
      </div>
    </MutationForm>
  );
}
