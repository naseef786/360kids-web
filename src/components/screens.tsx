import Image from "next/image";
import { Icon } from "./icon";
import Link from "next/link";
import { notFound } from "next/navigation";
import { backend, identity, requireIdentity } from "@/lib/server-api";
import { pageQuery, type Search } from "@/lib/page-query";
import type {
  Activity,
  Booking,
  Child,
  Page,
  Provider,
  Operations,
  Session,
} from "@/lib/types";
import { money, dateTime, stateLabel } from "@/lib/types";
import { serverDictionary } from "@/lib/server-locale";
import {
  bookingStatusCopy,
  parentCopy,
  type ParentCopy,
} from "@/lib/parent-copy";
import type { Locale } from "@/lib/i18n";
import { Empty, Pager, Shell, Title } from "./shell";
import { CatalogueEditor } from "./catalogue-editor";
import {
  ActivityForm,
  BookingActions,
  BookingRequest,
  ChildEditor,
  CorrectionForm,
  ProviderApplication,
  ProviderReview,
  Publication,
  SaveButton,
} from "./mutations";
const photos: Record<string, string> = {
  Sports: "movement",
  Arts: "creativity",
  Music: "creativity",
  Learning: "discovery",
  Outdoors: "movement",
  "Indoor play": "discovery",
};
export function ActivityCards({
  items,
  locale,
  copy,
  saved = false,
}: {
  items: Activity[];
  locale: Locale;
  copy: ParentCopy;
  saved?: boolean;
}) {
  return (
    <div className="activity-grid">
      {items.map((a) => (
        <article className="activity-card" key={a.id}>
          <Link
            className="activity-image"
            aria-label={`${copy.viewActivity}: ${a.title}`}
            href={`/activities/${a.id}`}
          >
            <Image
              src={`/activities/${photos[a.category] ?? "discovery"}.jpg`}
              alt=""
              width={1024}
              height={600}
              sizes="(max-width:650px) 90vw, 30vw"
            />
          </Link>
          <div className="activity-body">
            <span className="badge aqua">{a.category}</span>
            <h3 className="section-gap">
              <Link href={`/activities/${a.id}`}>{a.title}</Link>
            </h3>
            <p>
              {a.provider_name} · {a.area}
            </p>
            <div className="activity-facts">
              <span>
                {copy.ages} {a.min_age}–{a.max_age}
              </span>
            </div>
            <div className="activity-commercial">
              <span>{copy.perChild}</span>
              <strong>{money(a.price_fils, locale)}</strong>
            </div>
            <div className="card-actions">
              <Link className="btn small" href={`/activities/${a.id}`}>
                {copy.viewActivity}
              </Link>
              <SaveButton key={`${a.id}-${saved || a.is_saved}`} id={a.id} initial={saved || a.is_saved} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
export function Filters({
  query,
  copy,
}: {
  query: Record<string, string>;
  copy: ParentCopy;
}) {
  return (
    <form className="panel live-filters" action="/parent/activities">
      <label>
        {copy.activity}
        <input
          name="q"
          type="search"
          placeholder={copy.searchPlaceholder}
          defaultValue={query.q}
        />
      </label>
      <label>
        {copy.childAge}
        <select name="age" defaultValue={query.age ?? ""}>
          <option value="">{copy.allAges}</option>
          {Array.from({ length: 18 }, (_, i) => (
            <option key={i} value={i}>
              {i} {copy.years}
            </option>
          ))}
        </select>
      </label>
      <label>
        {copy.area}
        <input
          name="area"
          placeholder={copy.areaPlaceholder}
          defaultValue={query.area}
        />
      </label>
      <label>
        {copy.category}
        <select name="category" defaultValue={query.category ?? ""}>
          <option value="">{copy.allActivities}</option>
          {Object.keys(photos).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <button className="btn">{copy.exploreActivities}</button>
    </form>
  );
}
export async function DiscoveryScreen() {
  const { locale } = await serverDictionary();
  const copy = parentCopy[locale];
  const session = await identity();
  const data = await backend<Page<Activity>>("/activities?page=1&pageSize=3",session?.token);
  return (
    <Shell actor={session?.actor} publicPage>
      <section className="discovery-hero connected-hero">
        <div className="hero-copy">
          <span className="eyebrow">{copy.heroEyebrow}</span>
          <h1>{copy.heroTitle}</h1>
          <p>{copy.heroText}</p>
          <div className="card-actions">
            <Link className="btn" href="/parent/activities">
              {copy.exploreActivities}
            </Link>
          </div>
        </div>
        <div className="hero-collage" aria-hidden="true">
          <Image
            className="collage-one"
            src="/activities/discovery.jpg"
            alt=""
            width={1024}
            height={600}
            priority
          />
          <Image
            className="collage-two"
            src="/activities/movement.jpg"
            alt=""
            width={1024}
            height={600}
          />
          <Image
            className="collage-three"
            src="/activities/creativity.jpg"
            alt=""
            width={1024}
            height={600}
          />
          <span>✦</span>
        </div>
      </section>
      <Filters query={{}} copy={copy} />
      <section className="discovery-section" id="categories">
        <h2>{copy.exploreByCategory}</h2>
        <div className="category-grid">
          {Object.keys(photos).map((category, i) => (
            <Link
              className={`category-tile tile-${i % 3}`}
              key={category}
              href={`/parent/activities?category=${encodeURIComponent(category)}`}
            >
              <Icon name={category} size={36} />
              {category}
            </Link>
          ))}
        </div>
      </section>
      <section className="discovery-section">
        <div className="section-heading">
          <h2>{copy.discoverNew}</h2>
          <Link className="text-link" href="/parent/activities">
            {copy.viewAll} →
          </Link>
        </div>
        <p className="section-note">
          {copy.photographyNote}
        </p>
        {data.total ? (
          <ActivityCards items={data.items} locale={locale} copy={copy} />
        ) : (
          <Empty
            title={copy.emptyActivitiesTitle}
            note={copy.emptyActivitiesNote}
          />
        )}
      </section>
      <section className="discovery-section" id="how-it-works">
        <h2>{copy.journeyTitle}</h2>
        <div className="how-grid">
          {[
            [
              "01",
              copy.requestPlace,
              copy.requestPlaceNote,
            ],
            [
              "02",
              copy.reviewResponse,
              copy.reviewResponseNote,
            ],
            [
              "03",
              copy.confirmBooking,
              copy.confirmBookingNote,
            ],
          ].map(([n, t, d]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
    </Shell>
  );
}
export async function CatalogueScreen({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { locale } = await serverDictionary();
  const copy = parentCopy[locale];
  const query = await pageQuery(searchParams, ["q","age","area","category"]);
  const session = await identity();
  const data = await backend<Page<Activity>>(`/activities?${new URLSearchParams(query)}`,session?.token);
  return (
    <Shell actor={session?.actor} publicPage>
      <Title
        title={copy.exploreActivities}
        note={copy.catalogueNote}
      />
      <Filters query={query} copy={copy} />
      {data.items.length ? (
        <ActivityCards items={data.items} locale={locale} copy={copy} />
      ) : (
        <Empty
          title={copy.noMatches}
          note={copy.noMatchesNote}
        >
          <Link className="btn outline" href="/parent/activities">
            {copy.clearFilters}
          </Link>
        </Empty>
      )}
      <Pager data={data} query={query} base="/parent/activities" />
    </Shell>
  );
}
export async function ActivityScreen({ id }: { id: string }) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const { locale } = await serverDictionary();
  const copy = parentCopy[locale];
  const session = await identity();
  const a = await backend<Activity>(`/activities/${id}`,session?.token);
  const children = session
    ? await backend<Page<Child>>("/children?page=1&pageSize=10", session.token)
    : null;
  const sessions = await backend<Page<Session>>(
    `/activities/${id}/sessions?pageSize=10`,
  );
  return (
    <Shell actor={session?.actor} publicPage>
      <Link className="text-link" href="/parent/activities">
        ← {copy.allActivitiesBack}
      </Link>
      <Title title={a.title} note={`${a.provider_name} · ${a.area}`} />
      <div className="detail-grid">
        <section>
          <Image
            className="detail-cover"
            src={`/activities/${photos[a.category] ?? "discovery"}.jpg`}
            alt={copy.illustrativePhoto}
            width={1024}
            height={600}
            priority
          />
          <div className="detail-info">
            <dl>
              <dt>{copy.ages}</dt>
              <dd>
                {a.min_age}–{a.max_age} {copy.years}
              </dd>
              <dt>{copy.category}</dt>
              <dd>{a.category}</dd>
              <dt>{copy.perChild}</dt>
              <dd>{money(a.price_fils, locale)}</dd>
            </dl>
            <div>
              <h2>{copy.aboutActivity}</h2>
              <p className="section-gap">{a.description}</p>
            </div>
            <div>
              <h2>{copy.cancellationPolicy}</h2>
              <p className="section-gap">{a.policy}</p>
            </div>
            <SaveButton key={`${id}-${a.is_saved}`} id={id} initial={a.is_saved} />
          </div>
        </section>
        <BookingRequest
          key={`${a.id}-${a.version}`}
          activity={a}
          childrenPage={children}
          sessionsPage={sessions}
          signedIn={Boolean(session)}
          locale={locale}
          copy={copy.request}
        />
      </div>
    </Shell>
  );
}
export function BookingCards({
  items,
  locale,
  copy,
  role = "parent",
}: {
  items: Booking[];
  locale: Locale;
  copy: ParentCopy;
  role?: "parent" | "partner" | "admin";
}) {
  return (
    <div className="stack">
      {items.map((b) => (
        <article className="record-card" key={b.id}>
          <div className="section-heading">
            <div>
              <h3>{b.snapshot.title}</h3>
              <p className="record-meta">{b.snapshot.provider}</p>
            </div>
            <span
              className={`badge ${b.state === "CONFIRMED" ? "green" : b.state === "REQUESTED" ? "orange" : "aqua"}`}
            >
              {stateLabel(b.state, locale)}
            </span>
          </div>
          <p className="record-meta">
            {dateTime(b.snapshot.startsAt, locale)} · {copy.booking.dubaiTime}
          </p>
          <p className="record-meta">
            {b.quantity} {b.quantity === 1 ? copy.booking.child : copy.booking.children} ·{" "}
            {money(b.amount_fils, locale)}
          </p>
          <div className="card-actions">
            <Link
              className="btn outline small"
              href={`/${role}/bookings/${b.id}`}
            >
              {copy.booking.viewRequest}
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
export function BookingTable({
  items,
  role,
  locale = "en",
}: {
  items: Booking[];
  role: "partner" | "admin";
  locale?: Locale;
}) {
  return (
    <div className="panel row-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {[
              "Activity",
              "Session (Dubai)",
              "Children",
              "Total",
              "Status",
              "Review",
            ].map((label) => (
              <th key={label} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((b) => (
            <tr key={b.id}>
              <td>
                <strong>{b.snapshot.title}</strong>
                <p className="fine-print">{b.snapshot.provider}</p>
              </td>
              <td>{dateTime(b.snapshot.startsAt, locale)}</td>
              <td>{b.quantity}</td>
              <td>{money(b.amount_fils, locale)}</td>
              <td>
                <span className="badge aqua">{stateLabel(b.state, locale)}</span>
              </td>
              <td>
                <Link
                  className="btn outline small"
                  href={`/${role}/bookings/${b.id}`}
                >
                  View request
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export async function FamilyScreen() {
  const { locale } = await serverDictionary();
  const copy = parentCopy[locale];
  const { actor, token } = await requireIdentity("/parent");
  const [bookings, children] = await Promise.all([
    backend<Page<Booking>>("/bookings?scope=parent&pageSize=3", token),
    backend<Page<Child>>("/children?pageSize=3", token),
  ]);
  return (
    <Shell actor={actor}>
      <section className="family-banner">
        <div>
          <h1>Your family activities</h1>
          <p>
            More time exploring.
            <br />
            Everything you need in one place.
          </p>
        </div>
        <Image
          src="/activities/movement.jpg"
          alt=""
          width={1024}
          height={600}
        />
      </section>
      <div className="section-heading section-gap">
        <h2>Recent requests</h2>
        <Link className="text-link" href="/parent/bookings">
          View all ({bookings.total}) →
        </Link>
      </div>
      <div className="section-gap">
        {bookings.total ? (
          <BookingCards items={bookings.items} locale={locale} copy={copy} />
        ) : (
          <Empty
            title="Their next adventure starts here"
            note="Explore activities and request a place for your family."
          >
            <Link className="btn" href="/parent/activities">
              Find an activity
            </Link>
          </Empty>
        )}
      </div>
      <div className="family-grid">
        <section className="panel">
          <div className="section-heading">
            <h2>Your children</h2>
            <Link className="text-link" href="/parent/profile">
              Manage ({children.total})
            </Link>
          </div>
          {children.items.map((c) => (
            <div className="child-row" key={c.id}>
              <span className="avatar">{c.first_name[0]}</span>
              <b>{c.first_name}</b>
            </div>
          ))}
          {!children.total && (
            <p className="record-meta">
              Add a child to start exploring age-appropriate activities.
            </p>
          )}
        </section>
        <section className="panel">
          <h2>Keep the possibilities close</h2>
          <p className="record-meta">
            Save activities to your account and come back when the time is
            right.
          </p>
          <Link className="text-link" href="/parent/saved">
            View saved activities →
          </Link>
        </section>
      </div>
    </Shell>
  );
}
export async function BookingsScreen({
  searchParams,
  role = "parent",
}: {
  searchParams: Search;
  role?: "parent" | "partner" | "admin";
}) {
  const { locale } = await serverDictionary();
  const copy = parentCopy[locale];
  const path = role === "partner" ? "/partner" : `/${role}/bookings`,
    { actor, token } = await requireIdentity(
      path,
      role === "parent"
        ? undefined
        : role === "admin"
          ? "superadmin"
          : "partner",
    );
  const query = await pageQuery(searchParams, ["state"]);
  const data = await backend<Page<Booking>>(
    `/bookings?${new URLSearchParams({ ...query, scope: role === "admin" ? "all" : role })}`,
    token,
  );
  return (
    <Shell actor={actor} role={role}>
      <Title
        title={
          role === "parent"
            ? copy.booking.myBookings
            : role === "partner"
              ? "Activity requests"
              : "All bookings"
        }
        note={role === "parent" ? copy.booking.progressNote : "Review requests, responses and booking progress."}
      />
      <form action={path} className="bookings-toolbar">
        <label>
          {role === "parent" ? copy.booking.status : "Status"}
          <select name="state" defaultValue={query.state ?? ""}>
            <option value="">{role === "parent" ? copy.booking.allStatuses : "All statuses"}</option>
            {[
              "REQUESTED",
              "OFFER_PENDING",
              "PAYMENT_DUE",
              "PAYMENT_CHECKING",
              "CONFIRMED",
              "DECLINED",
              "EXPIRED",
              "CANCELLED",
            ].map((state) => (
              <option value={state} key={state}>
                {stateLabel(state, locale)}
              </option>
            ))}
          </select>
        </label>
        <button className="btn outline">{role === "parent" ? copy.booking.apply : "Apply"}</button>
      </form>
      {data.items.length ? (
        role === "parent" ? (
          <BookingCards items={data.items} locale={locale} copy={copy} />
        ) : (
          <BookingTable items={data.items} role={role} locale={locale} />
        )
      ) : (
        <Empty
          title={role === "parent" ? copy.booking.emptyTitle : "No requests here yet"}
          note={
            role === "parent"
              ? copy.booking.emptyNote
              : "New booking requests will appear here."
          }
        />
      )}
      <Pager data={data} query={query} base={path} />
    </Shell>
  );
}
export async function BookingDetailScreen({
  id,
  role = "parent",
}: {
  id: string;
  role?: "parent" | "partner" | "admin";
}) {
  const { locale } = await serverDictionary();
  const copy = parentCopy[locale];
  const { actor, token } = await requireIdentity(
    `/${role}/bookings/${id}`,
    role === "parent" ? undefined : role === "admin" ? "superadmin" : "partner",
  );
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const b = await backend<Booking>(`/bookings/${id}`, token);
  if (role === "parent" && b.parent_id !== actor.id) notFound();
  const status = await backend<{ financeEnabled: boolean }>("/status");
  const statusText = bookingStatusCopy(locale, b.state);
  const deadline =
    b.state === "REQUESTED"
      ? b.response_due_at
      : b.state === "OFFER_PENDING"
        ? b.offer?.expiresAt
        : b.state === "PAYMENT_DUE"
          ? b.payment_due_at
          : null;
  return (
    <Shell actor={actor} role={role}>
      <Link
        className="text-link"
        href={role === "partner" ? "/partner" : `/${role}/bookings`}
      >
        ← {role === "parent" ? copy.booking.allRequests : "All requests"}
      </Link>
      <Title title={b.snapshot.title} note={b.snapshot.provider} />
      <div className="detail-grid">
        <section className="record-card">
          <span className="badge aqua">{stateLabel(b.state, locale)}</span>
          {role === "parent" && (
            <dl className="status-summary">
              <div>
                <dt>{copy.booking.placeStatus}</dt>
                <dd>{statusText.place}</dd>
              </div>
              <div>
                <dt>{copy.booking.requiredAction}</dt>
                <dd>{statusText.action}</dd>
              </div>
              <div>
                <dt>{copy.booking.deadline}</dt>
                <dd>
                  {deadline
                    ? `${dateTime(deadline, locale)} · ${copy.booking.dubaiTime}`
                    : copy.booking.noDeadline}
                </dd>
              </div>
            </dl>
          )}
          <dl>
            <dt>{role === "parent" ? copy.booking.session : "Session"}</dt>
            <dd>{dateTime(b.snapshot.startsAt, locale)} ({copy.booking.dubaiTime})</dd>
            <dt>{role === "parent" ? copy.booking.children : "Children"}</dt>
            <dd>{b.snapshot.children.map((c) => c.firstName).join(", ")}</dd>
            <dt>{role === "parent" ? copy.booking.total : "Total"}</dt>
            <dd>{money(b.amount_fils, locale)}</dd>
            <dt>{role === "parent" ? copy.booking.reference : "Request reference"}</dt>
            <dd className="wrap-id">{b.id}</dd>
            {b.state === "REQUESTED" && (
              <>
                <dt>{role === "parent" ? copy.booking.responseDue : "Response due"}</dt>
                <dd>{dateTime(b.response_due_at, locale)}</dd>
              </>
            )}
            {b.payment_due_at && (
              <>
                <dt>{role === "parent" ? copy.booking.paymentDeadline : "Payment deadline"}</dt>
                <dd>{dateTime(b.payment_due_at, locale)}</dd>
              </>
            )}
          </dl>
          {b.offer && (
            <div className="offer-note">
              <h3>{role === "parent" ? copy.booking.providerOffer : "Provider offer"} · {money(b.offer.amountFils, locale)}</h3>
              <p>{b.offer.reason}</p>
              <p className="fine-print">
                {role === "parent" ? copy.booking.expires : "Expires"} {dateTime(b.offer.expiresAt, locale)}
              </p>
            </div>
          )}
          <h3>{role === "parent" ? copy.booking.acceptedPolicy : "Accepted cancellation policy"}</h3>
          <p className="record-meta details-policy">{b.snapshot.policy}</p>
          {b.payments?.map((payment, i) => (
            <p className="notice" key={i}>
              {role === "parent" ? copy.booking.payment : "Payment"} {payment.status} · {payment.reference}
            </p>
          ))}
          {b.refunds?.map((refund, i) => (
            <p className="notice" key={i}>
              {role === "parent" ? copy.booking.refund : "Refund"} {refund.status} · {money(refund.amount_fils, locale)}
            </p>
          ))}
        </section>
        <section className="panel">
          <h2>{role === "parent" ? copy.booking.nextSteps : "Next steps"}</h2>
          <p className="record-meta">
            {role === "parent" ? copy.booking.confirmedRule : "A request is confirmed only when its status says Confirmed."}
          </p>
          <BookingActions
            key={`${b.id}-${b.version}`}
            booking={b}
            mode={role}
            finance={status.financeEnabled}
            locale={locale}
            copy={role === "parent" ? copy.booking : undefined}
          />
        </section>
      </div>
    </Shell>
  );
}
export async function ProfilesScreen({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { actor, token } = await requireIdentity("/parent/profile"),
    query = await pageQuery(searchParams),
    data = await backend<Page<Child>>(
      `/children?${new URLSearchParams(query)}`,
      token,
    );
  return (
    <Shell actor={actor}>
      <Title
        title="Children & account"
        note="A little information helps us find the right fit."
      />
      <div className="panel">
        <h2>Your account</h2>
        <p className="record-meta">{actor.email}</p>
        <p className="fine-print">Account ID for partner staff access</p>
        <p className="wrap-id">{actor.id}</p>
        <Link className="text-link" href="/reset-password">
          Change password
        </Link>
      </div>
      <section className="panel section-gap">
        <h2>Add a child</h2>
        <div className="section-gap">
          <ChildEditor />
        </div>
      </section>
      <section className="section-gap">
        <h2>Your children ({data.total})</h2>
        <div className="stack section-gap">
          {data.items.map((child) => (
            <article className="record-card" key={child.id}>
              <h3>{child.first_name}</h3>
              <p className="record-meta">
                {child.age_years !== null
                  ? `Age ${child.age_years} · recorded ${child.age_recorded_on?.slice(0, 10)}`
                  : "Birth date provided"}
              </p>
              <details>
                <summary>Edit profile</summary>
                <ChildEditor key={JSON.stringify(child)} child={child} />
              </details>
            </article>
          ))}
        </div>
        <Pager data={data} query={query} base="/parent/profile" />
      </section>
    </Shell>
  );
}
export async function SavedScreen({ searchParams }: { searchParams: Search }) {
  const { locale } = await serverDictionary();
  const copy = parentCopy[locale];
  const { actor, token } = await requireIdentity("/parent/saved"),
    query = await pageQuery(searchParams),
    data = await backend<Page<Activity>>(
      `/saved?${new URLSearchParams(query)}`,
      token,
    );
  return (
    <Shell actor={actor}>
      <Title
        title="Saved activities"
        note="Keep their next favourite adventure close."
      />
      {data.items.length ? (
        <ActivityCards items={data.items} locale={locale} copy={copy} saved />
      ) : (
        <Empty
          title="A little inspiration goes a long way"
          note="Save activities while you explore, then find them here."
        >
          <Link className="btn" href="/parent/activities">
            Explore activities
          </Link>
        </Empty>
      )}
      <Pager data={data} query={query} base="/parent/saved" />
    </Shell>
  );
}
export async function OrganizationsScreen({
  searchParams,
  apply = false,
  admin = false,
}: {
  searchParams: Search;
  apply?: boolean;
  admin?: boolean;
}) {
  const path = admin
      ? "/admin/partners"
      : apply
        ? "/partner/apply"
        : "/partner/organizations",
    { actor, token } = await requireIdentity(
      path,
      admin ? "superadmin" : undefined,
    ),
    query = await pageQuery(searchParams, ["status","owned"], {status:["pending","approved","rejected","suspended"]}),
    data = await backend<Page<Provider>>(
      `/providers?${new URLSearchParams(query)}`,
      token,
    );
  return (
    <Shell
      actor={actor}
      role={
        admin ? "admin" : actor.roles.includes("partner") ? "partner" : "parent"
      }
    >
      <Title
        title={
          admin
            ? "Provider reviews"
            : apply
              ? "Become a 360 Kids partner"
              : "Your organizations"
        }
        note={
          admin
            ? "Review organizations before they join the public catalogue."
            : "Bring more possibilities to families in Dubai."
        }
      />
      {apply && (
        <section className="panel">
          <ProviderApplication />
        </section>
      )}
      <div className="stack section-gap">
        {data.items.map((provider) => (
          <article className="record-card" key={provider.id}>
            <div className="section-heading">
              <h3>{provider.name}</h3>
              <span className="badge aqua">{provider.status}</span>
            </div>
            <p className="record-meta">{provider.description}</p>
            {admin && (
              <details>
                <summary>Review application</summary>
                <ProviderReview provider={provider} />
              </details>
            )}
            {!admin && provider.status === "approved" && (
              <Link className="text-link" href="/partner">
                Open partner workspace →
              </Link>
            )}
          </article>
        ))}
      </div>
      {!data.total && (
        <Empty
          title="No organizations yet"
          note={
            admin
              ? "New partner applications will appear here."
              : "Submit an application to bring your activities to 360 Kids."
          }
        />
      )}
      <Pager data={data} query={query} base={path} />
    </Shell>
  );
}
export async function ProgramsScreen({
  searchParams,
  admin = false,
}: {
  searchParams: Search;
  admin?: boolean;
}) {
  const role = admin ? "admin" : "partner",
    path = `/${role}/programs`,
    { actor, token } = await requireIdentity(
      path,
      admin ? "superadmin" : "partner",
    ),
    query = await pageQuery(searchParams);
  const [data, providers] = await Promise.all([
    backend<Page<Activity>>(
      `/managed-activities?${new URLSearchParams(query)}`,
      token,
    ),
    backend<Page<Provider>>("/providers?status=approved&pageSize=20", token),
  ]);
  return (
    <Shell actor={actor} role={role}>
      <Title
        title={admin ? "Activity catalogue" : "Your listings"}
        note={
          admin
            ? "Create activities and review drafts for publication."
            : "Submit listings for platform review and request corrections."
        }
      />
      <details className="panel">
        <summary>Create an activity</summary>
        <div className="section-gap">
          <ActivityForm providers={providers} admin={admin} />
        </div>
      </details>
      <div className="stack section-gap">
        {data.items.map((activity) => (
          <article className="record-card" key={activity.id}>
            <div className="section-heading">
              <h3>{activity.title}</h3>
              <span className="badge aqua">
                {activity.published ? "Published" : "Draft · awaiting review"}
              </span>
            </div>
            <p className="record-meta">
              {activity.provider_name} · {activity.area} · Ages{" "}
              {activity.min_age}–{activity.max_age} ·{" "}
              {money(activity.price_fils)}
            </p>
            <p className="record-meta">{activity.description}</p>
            <details>
              <summary>Review details & policy</summary>
              <p className="details-policy">{activity.policy}</p>
            </details>
            {admin && (
              <details>
                <summary>Edit activity & sessions</summary>
                <CatalogueEditor key={`${activity.id}-${activity.version}`} activity={activity} />
              </details>
            )}
            <details>
              <summary>
                {admin ? "Publication decision" : "Request a correction"}
              </summary>
              {admin ? (
                <Publication activity={activity} />
              ) : (
                <CorrectionForm activity={activity} />
              )}
            </details>
          </article>
        ))}
      </div>
      {!data.total && (
        <Empty
          title="Let’s create new possibilities"
          note="Create your first activity using the form above."
        />
      )}
      <Pager data={data} query={query} base={path} />
    </Shell>
  );
}
export async function AdminScreen() {
  const { actor, token } = await requireIdentity("/admin", "superadmin"),
    data = await backend<Operations>("/admin/operations", token);
  return (
    <Shell actor={actor} role="admin">
      <Title
        title="Platform overview"
        note="A clear view of what needs your attention."
      />
      <div className="metric-grid">
        {[
          [
            data.counts.pending_providers,
            "Provider applications",
            "/admin/partners",
          ],
          [data.counts.draft_activities, "Activity drafts", "/admin/programs"],
          [data.counts.open_requests, "Open requests", "/admin/bookings"],
          [
            data.counts.pending_refunds,
            "Pending refunds",
            "/admin/operations?resource=refunds",
          ],
        ].map(([value, label, href]) => (
          <Link className="panel" key={label} href={String(href)}>
            <strong>{value}</strong>
            <span>{label}</span>
          </Link>
        ))}
      </div>
      <section className="panel">
        <h2>Platform settings</h2>
        <p className="record-meta">
          Payment workflow: {data.financeEnabled ? "Enabled" : "Not enabled"}
        </p>
        <p className="record-meta">
          WhatsApp delivery: {data.whatsappEnabled ? "Enabled" : "Not enabled"}
        </p>
        <p className="fine-print">
          Development requests and approvals can be tested using fictional data.
        </p>
      </section>
    </Shell>
  );
}
