"use client";
import Link from "next/link";
import MobileNavigation from "./mobile-navigation";
import { Form } from "./form";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  api,
  auth,
  date,
  money,
  type Activity,
  type Booking,
  type Child,
  type Operations,
  type Profile,
  type Provider,
} from "@/lib/client";
import {
  BaseFeatures,
  ChildEditor,
  ActivityManager,
  PublicContent,
  Recovery,
  BookingHistory,
} from "./base-features";
const labels: Record<string, string> = {
  REQUESTED: "Awaiting provider",
  OFFER_PENDING: "Your response needed",
  PAYMENT_DUE: "Payment due",
  PAYMENT_CHECKING: "Payment being checked",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};
const categories = [
  "All activities",
  "Creative arts",
  "Sports",
  "STEM",
  "Nature",
  "Music",
];
export default function Platform() {
  const path = usePathname(),
    router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null),
    [activities, setActivities] = useState<Activity[]>([]),
    [children, setChildren] = useState<Child[]>([]),
    [bookings, setBookings] = useState<Booking[]>([]),
    [providers, setProviders] = useState<Provider[]>([]),
    [ops, setOps] = useState<Operations | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [managed, setManaged] = useState<Activity[]>([]),
    [search, setSearch] = useState(""),
    [age, setAge] = useState(""),
    [area, setArea] = useState(""),
    [maxPrice, setMaxPrice] = useState(""),
    [onDate, setOnDate] = useState(""),
    [bookingFilter, setBookingFilter] = useState("all"),
    [category, setCategory] = useState("All activities"),
    [selected, setSelected] = useState<string[]>([]);
  const load = useCallback(async () => {
    try {
      const catalog = await api<Activity[]>("/activities");
      setActivities(catalog);
      setError("");
      const session = auth ? (await auth.auth.getSession()).data.session : null;
      if (auth && session) {
        const me = await api<Profile>("/me");
        const [kids, requests, partners] = await Promise.all([
          api<Child[]>("/children"),
          api<Booking[]>("/bookings"),
          api<Provider[]>("/providers"),
        ]);
        const operations =
          me.role === "admin"
            ? await api<Operations>("/admin/operations")
            : null;
        const listings = await api<Activity[]>("/manage/activities");
        if (
          (await auth.auth.getSession()).data.session?.user.id !==
          session.user.id
        )
          return;
        setManaged(listings);
        setProfile(me);
        setOps(operations);
        setChildren(kids);
        setBookings(requests);
        setProviders(partners);
      } else {
        setProfile(null);
        setBookings([]);
        setChildren([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (auth) {
      const subscription = auth.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
          setProfile(null);
          setChildren([]);
          setBookings([]);
          setProviders([]);
          setManaged([]);
          setOps(null);
          setSelected([]);
          setLoading(false);
        }
        setTimeout(() => void load(), 0);
      });
      return () => subscription.data.subscription.unsubscribe();
    }
    let mounted = true;
    void api<Activity[]>("/activities")
      .then((data) => {
        if (mounted) {
          setActivities(data);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (mounted) {
          setError(e instanceof Error ? e.message : "Unable to load.");
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [load]);
  const isHome = path === "/",
    isCatalog = path === "/activities",
    isDetail = path.startsWith("/activities/"),
    isAccount = path.startsWith("/account"),
    isProvider = path.startsWith("/provider"),
    isAdmin = path.startsWith("/admin");
  const activity = isDetail
    ? activities.find((a) => a.id === path.split("/")[2])
    : null;
  const links = isAdmin
    ? [
        ["Overview", "/admin"],
        ["Bookings", "/admin/bookings"],
        ["Providers", "/admin/providers"],
        ["Activities", "/admin/activities"],
        ["Payments & refunds", "/admin/finance"],
        ["WhatsApp contacts", "/admin/contacts"],
        ["Campaigns", "/admin/campaigns"],
        ["Subscriptions", "/admin/subscriptions"],
        ["Page content", "/admin/content"],
        ["Support inbox", "/admin/support"],
        ["Corrections", "/admin/corrections"],
        ["Audit trail", "/admin/audit"],
      ]
    : isProvider
      ? [
          ["Overview", "/provider"],
          ["Incoming requests", "/provider/requests"],
          ["My activities", "/provider/activities"],
          ["My business", "/provider/profile"],
          ["Subscription", "/provider/subscription"],
          ["Help & support", "/provider/support"],
        ]
      : [
          ["Overview", "/account"],
          ["My bookings", "/account/bookings"],
          ["My children", "/account/children"],
          ["Settings", "/account/settings"],
          ["Help & support", "/account/support"],
        ];
  async function act(
    b: Booking,
    action: string,
    extra: Record<string, unknown> = {},
  ) {
    await api("/bookings/" + b.id + "/actions", {
      action,
      version: b.version,
      ...extra,
    });
    await load();
  }
  function bookingList() {
    const visible = bookings.filter(
      (b) => bookingFilter === "all" || b.state === bookingFilter,
    );
    return visible.length ? (
      <div className="booking-list">
        {visible.map((b) => (
          <article className="booking" key={b.id}>
            <div className="row">
              <span className={"badge " + b.state.toLowerCase()}>
                {labels[b.state]}
              </span>
              <small>#{b.id.slice(0, 8)}</small>
            </div>
            <h3>{b.snapshot.title}</h3>
            <p>
              {b.snapshot.provider} · {date(b.snapshot.startsAt)}
            </p>
            <p>
              {b.children.map((c) => c.first_name).join(", ")} ·{" "}
              {money(b.amount_fils)}
            </p>
            <div className="status-box">
              <strong>
                {b.state === "CONFIRMED"
                  ? "Your places are confirmed"
                  : b.held
                    ? "Your places are held"
                    : "Places are not reserved"}
              </strong>
              <span>
                {b.state === "REQUESTED"
                  ? "The provider will check availability."
                  : b.state === "OFFER_PENDING"
                    ? "Review the proposed total before accepting."
                    : b.state === "PAYMENT_CHECKING"
                      ? "Your payment is awaiting verification."
                      : b.state === "PAYMENT_DUE"
                        ? "Complete payment using the agreed instructions."
                        : "See your booking history or contact support."}
              </span>
              {["REQUESTED", "OFFER_PENDING", "PAYMENT_DUE"].includes(
                b.state,
              ) && (
                <small>
                  {b.state === "PAYMENT_DUE"
                    ? "Payment"
                    : b.state === "OFFER_PENDING"
                      ? "Offer reply"
                      : "Provider response"}{" "}
                  deadline:{" "}
                  {date(
                    b.state === "OFFER_PENDING" && b.offer?.expiresAt
                      ? b.offer.expiresAt
                      : b.payment_due_at || b.response_due_at,
                  )}{" "}
                  (Dubai)
                </small>
              )}
            </div>
            {b.offer && (
              <p>
                Proposed total: <strong>{money(b.offer.amountFils)}</strong> ·{" "}
                {b.offer.reason}
                {b.offer.startsAt && (
                  <span> · Proposed session: {date(b.offer.startsAt)}</span>
                )}
              </p>
            )}
            {b.refunds?.map((r) => (
              <p key={r.status} className="notice">
                Refund {r.status}: {money(r.amount_fils)}
              </p>
            ))}
            <BookingHistory id={b.id} />
            <details>
              <summary>Accepted cancellation terms</summary>
              <p>{b.snapshot.policy}</p>
            </details>
            <div className="actions">
              {isAccount && b.state === "OFFER_PENDING" && (
                <Action
                  label="Accept revised offer"
                  onClick={() => act(b, "accept-offer")}
                />
              )}{" "}
              {(isProvider || isAdmin) && b.state === "REQUESTED" && (
                <>
                  <Action
                    label="Accept & hold places"
                    onClick={() => act(b, "accept")}
                  />
                  <Action label="Decline" onClick={() => act(b, "decline")} />
                  <Form
                    fields={[
                      {
                        name: "amount",
                        label: "Revised total (AED)",
                        type: "number",
                      },
                      { name: "reason", label: "Explain the change" },
                      {
                        name: "sessionId",
                        label: "Proposed session",
                        options: [
                          { value: "", label: "Keep requested session" },
                          ...(
                            managed.find((a) =>
                              a.sessions.some((s) => s.id === b.session_id),
                            )?.sessions || []
                          ).map((session) => ({
                            value: session.id,
                            label: date(session.starts_at),
                          })),
                        ],
                        required: false,
                      },
                    ]}
                    submit="Send revised offer"
                    onSubmit={(d) =>
                      act(b, "offer", {
                        sessionId: d.sessionId || undefined,
                        amountFils: Math.round(Number(d.amount) * 100),
                        reason: d.reason,
                      })
                    }
                  />
                </>
              )}
              {isAccount && b.state === "PAYMENT_DUE" && (
                <Form
                  fields={[
                    { name: "reference", label: "Bank transfer reference" },
                  ]}
                  submit="Submit for verification"
                  onSubmit={(d) => act(b, "proof", { reference: d.reference })}
                />
              )}{" "}
              {isAdmin && b.state === "PAYMENT_CHECKING" && (
                <Action
                  label="Verify received payment"
                  onClick={() => act(b, "verify")}
                />
              )}{" "}
              {!["CANCELLED", "EXPIRED", "DECLINED"].includes(b.state) && (
                <Form
                  fields={[{ name: "reason", label: "Cancellation reason" }]}
                  submit={
                    isProvider ? "Cancel as provider" : "Request cancellation"
                  }
                  onSubmit={(d) => act(b, "cancel", { reason: d.reason })}
                />
              )}
            </div>
          </article>
        ))}
      </div>
    ) : (
      <Empty
        title="No bookings yet"
        text="Your requests and confirmed activities will appear here."
      />
    );
  }
  function catalog() {
    const list = (isProvider ? managed : activities)
      .filter(
        (a) => !isProvider || providers.some((p) => p.id === a.provider_id),
      )
      .filter(
        (a) =>
          (category === "All activities" || a.category === category) &&
          (!age || (Number(age) >= a.min_age && Number(age) <= a.max_age)) &&
          (!area || a.area === area) &&
          (!maxPrice || a.price_fils <= Number(maxPrice) * 100) &&
          (!onDate ||
            a.sessions.some(
              (session) =>
                new Date(session.starts_at).toLocaleDateString("en-CA", {
                  timeZone: "Asia/Dubai",
                }) === onDate,
            )) &&
          `${a.title} ${a.area} ${a.category}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      );
    return (
      <>
        <div className="search">
          <label>
            Find an activity
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Try art, football, or your area"
            />
          </label>
          <label>
            Interest
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {[
                ...new Set([
                  ...categories,
                  ...activities.map((a) => a.category),
                ]),
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="filter-grid">
          <label>
            Child’s age
            <input
              type="number"
              min="0"
              max="18"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Any age"
            />
          </label>
          <label>
            Area
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">All areas</option>
              {[...new Set(activities.map((a) => a.area))]
                .sort()
                .map((value) => (
                  <option key={value}>{value}</option>
                ))}
            </select>
          </label>
          <label>
            Maximum price (AED)
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Any budget"
            />
          </label>
          <label>
            Activity date
            <input
              type="date"
              value={onDate}
              onChange={(e) => setOnDate(e.target.value)}
            />
          </label>
          <button
            className="text-button"
            onClick={() => {
              setSearch("");
              setCategory("All activities");
              setAge("");
              setArea("");
              setMaxPrice("");
              setOnDate("");
            }}
          >
            Clear filters
          </button>
        </div>
        <div className="row">
          <p>{list.length} activities to explore</p>
          <small>Availability checked by each provider</small>
        </div>
        {list.length ? (
          <div className="cards">
            {list.map((a, i) => (
              <Link href={"/activities/" + a.id} className="card" key={a.id}>
                <div className={"art art-" + (i % 4)}>
                  <span>
                    {a.category === "Sports"
                      ? "↗"
                      : a.category === "STEM"
                        ? "✳"
                        : "✽"}
                  </span>
                  <small>{a.category}</small>
                </div>
                <div className="card-body">
                  <div className="row">
                    <span className="eyebrow">{a.area}</span>
                    <small>
                      Ages {a.min_age}–{a.max_age}
                    </small>
                  </div>
                  <h3>{a.title}</h3>
                  <p>{a.provider_name}</p>
                  <div className="row">
                    <strong>
                      {money(a.price_fils)} <small>/ child</small>
                    </strong>
                    <span className="round">↗</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty
            title="More adventures are on their way"
            text="Try a different search, or check back as providers add new activities."
          />
        )}
      </>
    );
  }
  const parentNavigation =
    !isProvider &&
    !isAdmin &&
    profile?.role !== "provider" &&
    profile?.role !== "admin" &&
    path !== "/sign-in" &&
    path !== "/reset-password";
  return (
    <div
      className={
        parentNavigation ? "app-shell with-parent-navigation" : "app-shell"
      }
    >
      <header className="topbar">
        <Link href="/" className="brand">
          360
          <span>
            Kids Activity<span className="brand-dot">●</span>
          </span>
        </Link>
        <nav className="desktop-navigation" aria-label="Main navigation">
          <Link href="/activities">Explore activities</Link>
          <Link href="/about">Our story</Link>
          <Link href="/become-a-provider">For providers</Link>
        </nav>
        <details className="compact-navigation" key={path}>
          <summary>Menu</summary>
          <nav aria-label="More navigation">
            <Link href="/activities">Explore activities</Link>
            <Link href="/about">Our story</Link>
            <Link href="/become-a-provider">For providers</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </details>
        <div className="actions header-actions">
          <Link
            href={profile ? "/account" : "/sign-in"}
            className="button secondary"
          >
            {profile ? "My account" : "Sign in"}
          </Link>
          {profile?.role === "admin" && (
            <Link href="/admin" className="button">
              Admin
            </Link>
          )}
          {profile?.role === "provider" && (
            <Link href="/provider" className="button">
              Provider portal
            </Link>
          )}
        </div>
      </header>
      {(isHome || isCatalog) && (
        <section className={"hero " + (isCatalog ? "compact" : "")}>
          <div>
            <p className="eyebrow">Discover. Grow. Belong.</p>
            <h1>
              {isCatalog ? (
                <>
                  A little curiosity.
                  <br />
                  <em>Endless possibilities.</em>
                </>
              ) : (
                <>
                  Their next big thing
                  <br />
                  starts with a<br />
                  <em>little adventure.</em>
                </>
              )}
            </h1>
            <p>
              Thoughtfully chosen activities for curious kids.
              <br />
              Find what they love, close to home.
            </p>
            {isHome && (
              <Link href="/activities" className="button">
                Find their next adventure <span>↗</span>
              </Link>
            )}
          </div>
          {isHome && (
            <div className="hero-art" aria-hidden="true">
              <span className="orbit one">✳</span>
              <div className="arch">
                <span>play.</span>
                <span>learn.</span>
                <span>grow.</span>
              </div>
              <span className="orbit two">✽</span>
              <div className="art-note">
                Big discoveries.
                <br />
                Little explorers.
              </div>
            </div>
          )}
        </section>
      )}
      {error && (
        <div role="alert" className="global-error">
          <strong>We couldn’t load the latest information.</strong>
          <p>{error}</p>
          <button onClick={() => void load()}>Try again</button>
        </div>
      )}
      <main
        className={
          isAccount || isProvider || isAdmin
            ? `workspace ${isAccount ? "family-workspace" : ""}`
            : "content"
        }
      >
        {(isAccount || isProvider || isAdmin) && (
          <aside>
            <p className="eyebrow">
              {isAdmin
                ? "Platform management"
                : isProvider
                  ? "Provider workspace"
                  : "Your family space"}
            </p>
            {links.map(([label, href]) => (
              <Link
                className={path === href ? "active" : ""}
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
            {profile && (
              <Action
                label="Sign out"
                onClick={async () => {
                  await auth?.auth.signOut();
                  router.push("/");
                }}
              />
            )}
          </aside>
        )}
        <div className="main-panel">
          {loading ? (
            <div role="status" className="loading">
              Finding your next adventure…
            </div>
          ) : (
            <>
              {isHome && (
                <>
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">Make room for wonder</p>
                      <h2>Something for every little personality.</h2>
                    </div>
                    <Link href="/activities">Explore all ↗</Link>
                  </div>
                  <div className="chips">
                    {categories.slice(1).map((c, i) => (
                      <Link key={c} href="/activities">
                        <span>{["✽", "↗", "✳", "☀", "♫"][i]}</span>
                        {c}
                      </Link>
                    ))}
                  </div>
                  {catalog()}
                  <section className="how">
                    <p className="eyebrow">Simple from the start</p>
                    <h2>
                      Know where you stand.
                      <br />
                      At every step.
                    </h2>
                    <div className="three">
                      {[
                        [
                          "01",
                          "Find their thing",
                          "Explore activities by interest, age and location.",
                        ],
                        [
                          "02",
                          "Request a place",
                          "The provider checks availability and holds accepted places.",
                        ],
                        [
                          "03",
                          "You’re all set",
                          "Verified payment confirms the booking.",
                        ],
                      ].map(([n, t, b]) => (
                        <div key={n}>
                          <span>{n}</span>
                          <h3>{t}</h3>
                          <p>{b}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="partner">
                    <h2>
                      Help little people
                      <br />
                      <em>do big things.</em>
                    </h2>
                    <p>Bring your activities to more families.</p>
                    <Link className="button" href="/become-a-provider">
                      Become a provider ↗
                    </Link>
                  </section>
                </>
              )}
              {isCatalog && catalog()}
              {isDetail &&
                (activity ? (
                  <>
                    <Link href="/activities" className="back">
                      ← All activities
                    </Link>
                    <div className="detail-grid">
                      <section>
                        <div className="art detail-art">
                          <span>✽</span>
                          <small>{activity.category}</small>
                        </div>
                        <p className="eyebrow">
                          {activity.area} · {activity.category}
                        </p>
                        <h1 className="detail-title">{activity.title}</h1>
                        <p>
                          With {activity.provider_name} · Ages{" "}
                          {activity.min_age}–{activity.max_age}
                        </p>
                        <h3>Room to discover</h3>
                        <p className="prose">{activity.description}</p>
                        <h3>Cancellation policy</h3>
                        <p className="prose">{activity.policy}</p>
                      </section>
                      <section className="booking-box">
                        <h2>
                          {money(activity.price_fils)} <small>/ child</small>
                        </h2>
                        <p>
                          Request first. The provider checks availability before
                          payment.
                        </p>
                        {!profile ? (
                          <Link
                            href={
                              "/sign-in?returnTo=" + encodeURIComponent(path)
                            }
                            className="button"
                          >
                            Sign in to request
                          </Link>
                        ) : !children.length ? (
                          <Link href="/account/children" className="button">
                            Add your children first
                          </Link>
                        ) : activity.sessions.length ? (
                          <Form
                            fields={[
                              {
                                name: "sessionId",
                                label: "Choose a session",
                                options: activity.sessions.map((s) => ({
                                  value: s.id,
                                  label: date(s.starts_at),
                                })),
                              },
                            ]}
                            submit="Request to Book"
                            onSubmit={async (d) => {
                              if (!selected.length)
                                throw new Error("Select at least one child.");
                              await api("/bookings", {
                                sessionId: d.sessionId,
                                childIds: selected,
                                policyAccepted: true,
                              });
                              router.push("/account/bookings");
                              await load();
                            }}
                          >
                            <fieldset>
                              <legend>Who’s joining?</legend>
                              {children.map((c) => (
                                <label className="check" key={c.id}>
                                  <input
                                    type="checkbox"
                                    checked={selected.includes(c.id)}
                                    onChange={(e) =>
                                      setSelected((v) =>
                                        e.target.checked
                                          ? [...v, c.id]
                                          : v.filter((id) => id !== c.id),
                                      )
                                    }
                                  />
                                  {c.first_name} {c.surname}
                                </label>
                              ))}
                            </fieldset>
                            <label className="check">
                              <input type="checkbox" required />I accept the
                              cancellation policy shown here.
                            </label>
                          </Form>
                        ) : (
                          <Empty
                            title="No open sessions"
                            text="Please check back for new dates."
                          />
                        )}
                        <small>
                          A request does not reserve places. All deadlines use
                          Dubai time.
                        </small>
                      </section>
                    </div>
                  </>
                ) : (
                  <Empty
                    title="Activity unavailable"
                    text="This activity may no longer be published."
                  />
                ))}
              {path === "/reset-password" && <Recovery reset />}
              {path === "/sign-in" && (
                <section className="auth-card">
                  <p className="eyebrow">Your next adventure awaits</p>
                  <h1>
                    Welcome to
                    <br />
                    <em>your family space.</em>
                  </h1>
                  <Form
                    fields={[
                      { name: "email", label: "Email address", type: "email" },
                      { name: "password", label: "Password", type: "password" },
                    ]}
                    submit="Sign in"
                    onSubmit={async (d) => {
                      if (!auth)
                        throw new Error(
                          "Account sign-in needs the Supabase project configuration.",
                        );
                      const { error } = await auth.auth.signInWithPassword({
                        email: d.email,
                        password: d.password,
                      });
                      if (error) throw error;
                      const destination = new URLSearchParams(
                        window.location.search,
                      ).get("returnTo");
                      router.push(
                        destination?.startsWith("/") &&
                          !destination.startsWith("//")
                          ? destination
                          : "/account",
                      );
                      await load();
                    }}
                  />
                  <Recovery />
                  <details>
                    <summary>New here? Create an account</summary>
                    <Form
                      fields={[
                        { name: "email", label: "Email", type: "email" },
                        {
                          name: "password",
                          label: "Password (at least 12 characters)",
                          type: "password",
                        },
                      ]}
                      submit="Create account"
                      onSubmit={async (d) => {
                        if (d.password.length < 12)
                          throw new Error("Use at least 12 characters.");
                        if (!auth)
                          throw new Error("Sign-up is not configured yet.");
                        const { error } = await auth.auth.signUp({
                          email: d.email,
                          password: d.password,
                        });
                        if (error) throw error;
                      }}
                    />
                  </details>
                </section>
              )}
              {(isAccount || isProvider || isAdmin) &&
                (!profile ? (
                  <Empty
                    title="Sign in to continue"
                    text="Use your account to access this workspace."
                    action={
                      <Link href="/sign-in" className="button">
                        Sign in
                      </Link>
                    }
                  />
                ) : isAdmin && profile.role !== "admin" ? (
                  <Empty
                    title="Admin access required"
                    text="Your account does not have permission to open this workspace."
                  />
                ) : isProvider &&
                  profile.role !== "provider" &&
                  profile.role !== "admin" ? (
                  <Empty
                    title="Provider access required"
                    text="Apply below or contact the team about your approved application."
                    action={
                      <Link href="/become-a-provider">Apply as a provider</Link>
                    }
                  />
                ) : (
                  <>
                    <div className="section-heading">
                      <div>
                        <p className="eyebrow">
                          {isAdmin
                            ? "360 Kids operations"
                            : isProvider
                              ? "Make every response count"
                              : "A little less planning. A lot more play."}
                        </p>
                        <h1 className="workspace-title">
                          {links.find(([, href]) => href === path)?.[0] ||
                            "Overview"}
                        </h1>
                      </div>
                      <span className="avatar">
                        {profile.email.slice(0, 1).toUpperCase()}
                      </span>
                    </div>
                    {(path === "/account" ||
                      path === "/provider" ||
                      path === "/admin") && (
                      <>
                        <div className="stats">
                          <Stat
                            label="Requests"
                            value={
                              bookings.filter((b) => b.state === "REQUESTED")
                                .length
                            }
                          />
                          <Stat
                            label="Payment checks"
                            value={
                              bookings.filter(
                                (b) => b.state === "PAYMENT_CHECKING",
                              ).length
                            }
                          />
                          <Stat
                            label="Confirmed"
                            value={
                              bookings.filter((b) => b.state === "CONFIRMED")
                                .length
                            }
                          />
                        </div>
                        <h2>
                          {isAccount
                            ? "Your upcoming adventures"
                            : "Needs attention"}
                        </h2>
                        {bookingList()}
                      </>
                    )}
                    {(path.endsWith("/bookings") ||
                      path.endsWith("/requests")) && (
                      <>
                        <label className="booking-filter">
                          Booking status
                          <select
                            value={bookingFilter}
                            onChange={(e) => setBookingFilter(e.target.value)}
                          >
                            <option value="all">All statuses</option>
                            {Object.entries(labels).map(([value, label]) => (
                              <option value={value} key={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>
                        {bookingList()}
                      </>
                    )}
                    {path === "/account/children" && (
                      <>
                        <p>
                          Only the information needed to check eligibility and
                          arrange the activity.
                        </p>
                        <div className="cards">
                          {children.map((c) => (
                            <article className="panel" key={c.id}>
                              <span className="child-icon">✳</span>
                              <h3>
                                {c.first_name} {c.surname}
                              </h3>
                              <p>
                                Date of birth:{" "}
                                {String(c.birth_date).slice(0, 10)}
                              </p>
                              <ChildEditor child={c} refresh={load} />
                            </article>
                          ))}
                        </div>
                        <section className="panel">
                          <h2>Add a child</h2>
                          <Form
                            fields={[
                              { name: "firstName", label: "First name" },
                              { name: "surname", label: "Surname" },
                              {
                                name: "birthDate",
                                label: "Date of birth",
                                type: "date",
                              },
                            ]}
                            submit="Add child"
                            onSubmit={async (d) => {
                              await api("/children", d);
                              await load();
                            }}
                          />
                        </section>
                      </>
                    )}
                    {(path === "/provider/profile" ||
                      path === "/admin/providers") && (
                      <div className="cards">
                        {providers.map((p) => (
                          <article className="panel" key={p.id}>
                            <span className="badge">{p.status}</span>
                            <h3>{p.name}</h3>
                            <p>{p.description}</p>
                            {isAdmin && (
                              <div className="actions">
                                {["approved", "rejected", "suspended"].map(
                                  (status) => (
                                    <Action
                                      key={status}
                                      label={status}
                                      onClick={async () => {
                                        await api(
                                          "/providers/" + p.id + "/review",
                                          { status },
                                        );
                                        await load();
                                      }}
                                    />
                                  ),
                                )}
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                    {path === "/provider/activities" && (
                      <>
                        {catalog()}
                        <section className="panel">
                          <h2>Request a content correction</h2>
                          <Form
                            fields={[
                              {
                                name: "activityId",
                                label: "Activity",
                                options: managed.map((a) => ({
                                  value: a.id,
                                  label: a.title,
                                })),
                              },
                              {
                                name: "message",
                                label: "Requested correction",
                                type: "textarea",
                              },
                            ]}
                            submit="Send for review"
                            onSubmit={async (d) => {
                              await api(
                                "/activities/" + d.activityId + "/corrections",
                                { message: d.message },
                              );
                            }}
                          />
                        </section>
                      </>
                    )}
                    {path === "/admin/activities" && (
                      <ActivityManager activities={managed} refresh={load} />
                    )}
                    <BaseFeatures
                      path={path}
                      profile={profile}
                      refresh={load}
                    />
                    {path === "/admin/activities" && (
                      <section className="panel">
                        <h2>Publish an activity</h2>
                        <Form
                          fields={[
                            {
                              name: "providerId",
                              label: "Approved provider",
                              options: providers
                                .filter((p) => p.status === "approved")
                                .map((p) => ({ value: p.id, label: p.name })),
                            },
                            ...[
                              "title",
                              "description",
                              "category",
                              "area",
                              "policy",
                            ].map((name) => ({
                              name,
                              label: name[0].toUpperCase() + name.slice(1),
                              type: ["description", "policy"].includes(name)
                                ? "textarea"
                                : "text",
                            })),
                            {
                              name: "price",
                              label: "Price per child (AED)",
                              type: "number",
                            },
                            {
                              name: "minAge",
                              label: "Minimum age",
                              type: "number",
                            },
                            {
                              name: "maxAge",
                              label: "Maximum age",
                              type: "number",
                            },
                            {
                              name: "startsAt",
                              label: "Session start (your device timezone)",
                              type: "datetime-local",
                            },
                            {
                              name: "cutoffAt",
                              label: "Booking cutoff (your device timezone)",
                              type: "datetime-local",
                            },
                            {
                              name: "capacity",
                              label: "Places allocated to the platform",
                              type: "number",
                            },
                            {
                              name: "publication",
                              label: "Visibility",
                              options: [
                                { value: "false", label: "Save as draft" },
                                {
                                  value: "true",
                                  label: "Publish reviewed activity",
                                },
                              ],
                            },
                          ]}
                          submit="Create activity"
                          onSubmit={async (d) => {
                            await api("/activities", {
                              ...d,
                              minAge: Number(d.minAge),
                              maxAge: Number(d.maxAge),
                              priceFils: Math.round(Number(d.price) * 100),
                              capacity: Number(d.capacity),
                              startsAt: new Date(d.startsAt).toISOString(),
                              cutoffAt: new Date(d.cutoffAt).toISOString(),
                              published: d.publication === "true",
                            });
                            await load();
                          }}
                        />
                      </section>
                    )}
                    {path === "/admin/finance" && (
                      <>
                        <p className="notice">
                          {ops?.financeEnabled
                            ? "Finance review is enabled. Verify funds with your approved collection process."
                            : "Live finance actions need the approved recipient and verifier configuration."}
                        </p>
                        <h2>Refunds</h2>
                        {ops?.refunds.length ? (
                          ops.refunds.map((r) => (
                            <div className="panel" key={r.id}>
                              <span className="badge">{r.status}</span>
                              <strong>{money(r.amount_fils)}</strong>
                              <p>Booking #{r.booking_id.slice(0, 8)}</p>
                              {r.status !== "completed" && (
                                <Form
                                  fields={[
                                    {
                                      name: "reference",
                                      label:
                                        "Completed refund evidence / reference",
                                    },
                                  ]}
                                  submit="Record refund completion"
                                  onSubmit={async (d) => {
                                    await api(
                                      "/admin/refunds/" + r.id + "/complete",
                                      d,
                                    );
                                    await load();
                                  }}
                                />
                              )}
                            </div>
                          ))
                        ) : (
                          <Empty
                            title="No refund obligations"
                            text="Provider cancellations of paid bookings will appear here."
                          />
                        )}
                        {bookingList()}
                      </>
                    )}
                    {path === "/admin/contacts" && (
                      <>
                        <p className="notice">
                          Imported contacts remain unverified. Existing opt-outs
                          are preserved.
                        </p>
                        <section className="panel">
                          <h2>Validate contact import</h2>
                          <Form
                            fields={[
                              { name: "source", label: "Source label" },
                              {
                                name: "rows",
                                label:
                                  'Contacts as JSON: [{"phone":"+…","name":"…"}]',
                                type: "textarea",
                              },
                              {
                                name: "mode",
                                label: "Import mode",
                                options: [
                                  { value: "preview", label: "Preview only" },
                                  {
                                    value: "commit",
                                    label: "Import as unverified contacts",
                                  },
                                ],
                              },
                            ]}
                            submit="Validate contacts"
                            onSubmit={async (d) => {
                              const r = await api<{
                                valid: number;
                                invalid: number;
                                duplicates: number;
                                sendingEligible: number;
                              }>("/admin/contacts/import", {
                                source: d.source,
                                rows: JSON.parse(d.rows),
                                commit: d.mode === "commit",
                              });
                              window.alert(
                                `${r.valid} valid, ${r.invalid} invalid, ${r.duplicates} duplicates. ${r.sendingEligible} eligible to message.`,
                              );
                              await load();
                            }}
                          />
                        </section>
                        {ops?.contacts.map((c) => (
                          <div className="panel row" key={c.id}>
                            <div>
                              <strong>{c.name}</strong>
                              <p>
                                Number ending {c.phone_suffix} ·{" "}
                                {c.suppressed ? "Opted out" : c.marketing}
                              </p>
                            </div>
                            {!c.suppressed && (
                              <Action
                                label="Record opt-out"
                                onClick={async () => {
                                  await api(
                                    "/admin/contacts/" + c.id + "/suppress",
                                    {},
                                  );
                                  await load();
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </>
                    )}
                    {path === "/admin/campaigns" && (
                      <>
                        <p className="notice">
                          Campaigns can be drafted. Sending needs a configured
                          official WhatsApp sender, approved templates and
                          verified audience permission.
                        </p>
                        <div className="cards">
                          {ops?.campaigns.map((c) => (
                            <article className="panel" key={c.id}>
                              <span className="badge">{c.status}</span>
                              <h3>{c.name}</h3>
                              <p>
                                {c.template} · {c.language}
                              </p>
                            </article>
                          ))}
                        </div>
                        <section className="panel">
                          <h2>Draft a campaign</h2>
                          <Form
                            fields={[
                              { name: "name", label: "Campaign name" },
                              { name: "template", label: "Template name" },
                              {
                                name: "language",
                                label: "Language code",
                                placeholder: "en",
                              },
                            ]}
                            submit="Save draft"
                            onSubmit={async (d) => {
                              await api("/admin/campaigns", d);
                              await load();
                            }}
                          />
                        </section>
                      </>
                    )}
                    {(path === "/provider/subscription" ||
                      path === "/admin/subscriptions") && (
                      <Empty
                        title="Provider subscriptions"
                        text="Plan prices, billing periods and entitlement rules are awaiting client decisions. Existing bookings remain accessible."
                      />
                    )}
                    {path === "/admin/audit" && (
                      <div className="panel">
                        {ops?.audit.map((e) => (
                          <div className="audit-row" key={e.id}>
                            <strong>{e.action}</strong>
                            <small>
                              {date(e.created_at)} · {e.subject_id.slice(0, 8)}
                            </small>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ))}
              {path === "/become-a-provider" && (
                <section className="auth-card">
                  <p className="eyebrow">Grow with 360 Kids</p>
                  <h1>
                    Big ideas.
                    <br />
                    <em>Brighter futures.</em>
                  </h1>
                  <p>
                    Tell us about your business. Our team reviews every
                    application before publishing activities.
                  </p>
                  {profile ? (
                    <Form
                      fields={[
                        { name: "name", label: "Business name" },
                        {
                          name: "description",
                          label: "About your activities",
                          type: "textarea",
                        },
                      ]}
                      submit="Submit application"
                      onSubmit={async (d) => {
                        await api("/providers", d);
                        await load();
                      }}
                    />
                  ) : (
                    <Link href="/sign-in" className="button">
                      Sign in to apply
                    </Link>
                  )}
                  {providers.map((p) => (
                    <p className="notice" key={p.id}>
                      {p.name}: {p.status}
                    </p>
                  ))}
                </section>
              )}
              {["/about", "/contact", "/faq", "/terms", "/privacy"].includes(
                path,
              ) && <PublicContent slug={path.slice(1)} />}
            </>
          )}
        </div>
      </main>
      <footer>
        <div className="brand">
          360 <span>Kids Activity</span>
        </div>
        <p>Little adventures. Lasting possibilities.</p>
        <div className="actions">
          {["About", "Contact", "FAQ", "Terms", "Privacy"].map((l) => (
            <Link key={l} href={"/" + l.toLowerCase()}>
              {l}
            </Link>
          ))}
        </div>
        <small>All booking deadlines are shown in Dubai time.</small>
      </footer>
      {parentNavigation && <MobileNavigation path={path} />}
    </div>
  );
}
function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <span aria-hidden="true">✳</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}
function Action({
  label,
  onClick,
}: {
  label: string;
  onClick: () => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await onClick();
          } catch (e) {
            setError(
              e instanceof Error ? e.message : "Unable to complete action.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Working…" : label}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
