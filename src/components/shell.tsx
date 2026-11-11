import Image from "next/image";
import Link from "next/link";
import {
  WorkspaceNav,
  ParentMobileNav,
  type WorkspaceLink,
} from "./workspace-nav";
import { SignOut } from "./account-controls";
import { NotificationLink } from "./notification-controls";
import { LanguageSwitcher } from "./language-switcher";
import { serverDictionary } from "@/lib/server-locale";
import type { Locale, ShellDictionary } from "@/lib/i18n";
import type { Identity, Page } from "@/lib/types";
import "./workspace.css";
import "./connected.css";

export function Brand({
  homeLabel = "360 Kids Activity home",
}: {
  homeLabel?: string;
}) {
  return (
    <Link className="brand" href="/" aria-label={homeLabel}>
      <Image
        src="/brand/360-kids-logo.webp"
        alt=""
        width={58}
        height={58}
        unoptimized
      />
      <span>
        <b>360</b> Kids Activity
      </span>
    </Link>
  );
}

export function Header({
  actor,
  role = "parent",
  locale,
  dictionary,
}: {
  actor?: Identity | null;
  role?: "parent" | "partner" | "admin";
  locale: Locale;
  dictionary: ShellDictionary;
}) {
  return (
    <header className="app-header">
      <Brand homeLabel={dictionary.brandHome} />
      <nav className="public-nav" aria-label={dictionary.website}>
        <Link href="/parent/activities">{dictionary.explore}</Link>
        <Link href="/#categories">{dictionary.categories}</Link>
        <Link href="/#how-it-works">{dictionary.howItWorks}</Link>
      </nav>
      <div className="header-actions">
        <LanguageSwitcher locale={locale} label={dictionary.language} />
        {actor ? (
          <>
            <nav
              className="role-links"
              aria-label={dictionary.workspaceNavigation}
            >
              <Link href="/parent">{dictionary.parent}</Link>
              {actor.roles.includes("partner") && (
                <Link href="/partner">{dictionary.partner}</Link>
              )}
              {actor.roles.includes("superadmin") && (
                <Link href="/admin">{dictionary.superadmin}</Link>
              )}
            </nav>
            <NotificationLink
              key={actor.id}
              href={`/${role}/notifications`}
              label={dictionary.updates}
              unavailableLabel={dictionary.updatesUnavailable}
              retryLabel={dictionary.retry}
            />
            <SignOut
              locale={locale}
              label={dictionary.signOut}
              pendingLabel={dictionary.signingOut}
            />
          </>
        ) : (
          <>
            <Link className="btn outline" href="/login">
              {dictionary.signIn}
            </Link>
            <Link className="btn" href="/partner/apply">
              {dictionary.becomePartner}
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export function Footer({ dictionary }: { dictionary: ShellDictionary }) {
  return (
    <footer className="app-footer">
      <span>{dictionary.footer.tagline}</span>
      <span>{dictionary.footer.location}</span>
      <nav aria-label={dictionary.footer.information}>
        <Link href="/about">{dictionary.footer.about}</Link>{" · "}
        <Link href="/contact">{dictionary.footer.contact}</Link>{" · "}
        <Link href="/faq">{dictionary.footer.faq}</Link>{" · "}
        <Link href="/terms">{dictionary.footer.terms}</Link>{" · "}
        <Link href="/privacy">{dictionary.footer.privacy}</Link>
      </nav>
    </footer>
  );
}

export async function Shell({
  actor,
  role = "parent",
  children,
  publicPage = false,
}: {
  actor?: Identity | null;
  role?: "parent" | "partner" | "admin";
  children: React.ReactNode;
  publicPage?: boolean;
}) {
  const { locale, dictionary } = await serverDictionary();
  const links: WorkspaceLink[] =
    role === "parent"
      ? [
          { label: dictionary.nav.overview, href: "/parent", icon: "home" },
          {
            label: dictionary.nav.exploreActivities,
            href: "/parent/activities",
            icon: "search",
          },
          {
            label: dictionary.nav.myBookings,
            href: "/parent/bookings",
            icon: "calendar",
          },
          {
            label: dictionary.nav.childrenAccount,
            href: "/parent/profile",
            icon: "person",
          },
          {
            label: dictionary.nav.savedActivities,
            href: "/parent/saved",
            icon: "heart",
          },
          {
            label: dictionary.nav.support,
            href: "/parent/support",
            icon: "grid",
          },
          {
            label: dictionary.becomePartner,
            href: "/partner/apply",
            icon: "grid",
          },
        ]
      : role === "partner"
        ? [
            {
              label: dictionary.nav.requests,
              href: "/partner",
              icon: "calendar",
            },
            {
              label: dictionary.nav.listings,
              href: "/partner/programs",
              icon: "grid",
            },
            {
              label: dictionary.nav.organizations,
              href: "/partner/organizations",
              icon: "home",
            },
            {
              label: dictionary.nav.teamAccess,
              href: "/partner/team",
              icon: "person",
            },
            {
              label: dictionary.nav.support,
              href: "/partner/support",
              icon: "grid",
            },
          ]
        : [
            { label: dictionary.nav.overview, href: "/admin", icon: "home" },
            {
              label: dictionary.nav.providerReviews,
              href: "/admin/partners",
              icon: "person",
            },
            {
              label: dictionary.nav.catalogue,
              href: "/admin/programs",
              icon: "grid",
            },
            {
              label: dictionary.nav.allBookings,
              href: "/admin/bookings",
              icon: "calendar",
            },
            {
              label: dictionary.nav.correctionsAudit,
              href: "/admin/operations",
              icon: "check",
            },
            {
              label: dictionary.nav.supportRequests,
              href: "/admin/support",
              icon: "grid",
            },
            {
              label: dictionary.nav.websiteContent,
              href: "/admin/content",
              icon: "grid",
            },
          ];
  const navigation: WorkspaceLink[] = [
    ...links,
    {
      label: dictionary.notifications,
      href: `/${role}/notifications`,
      icon: "grid",
    },
  ];
  return (
    <div className="platform">
      <a className="skip-link" href="#main">
        {dictionary.skip}
      </a>
      <Header
        actor={actor}
        role={role}
        locale={locale}
        dictionary={dictionary}
      />
      <div className={publicPage ? "discovery-main" : "workspace-layout"}>
        {!publicPage && (
          <aside className="workspace-sidebar">
            <p className="sidebar-label">
              {role === "parent"
                ? dictionary.familyLabel
                : role === "partner"
                  ? dictionary.partnerLabel
                  : dictionary.adminLabel}
            </p>
            <WorkspaceNav
              links={navigation}
              label={dictionary.workspaceNavigation}
            />
            {actor && (
              <div className="sidebar-foot">
                <div>
                  <b>
                    {role === "parent"
                      ? dictionary.familyAccount
                      : role === "partner"
                        ? dictionary.partnerAccount
                        : dictionary.platformTeam}
                  </b>
                  <small>{actor.email}</small>
                </div>
              </div>
            )}
          </aside>
        )}
        <main
          className={publicPage ? "" : "workspace-main"}
          id="main"
          tabIndex={-1}
        >
          <p className="preview-notice">
            <span>{dictionary.development}</span>
            {dictionary.preview}
          </p>
          {children}
          <Footer dictionary={dictionary} />
        </main>
      </div>
      {role === "parent" && (
        <ParentMobileNav
          label={dictionary.parentNavigation}
          items={[
            {
              label: dictionary.explore,
              href: "/parent/activities",
              icon: "home",
            },
            {
              label: dictionary.nav.saved,
              href: "/parent/saved",
              icon: "heart",
            },
            {
              label: dictionary.nav.bookings,
              href: "/parent/bookings",
              icon: "calendar",
            },
            {
              label: dictionary.nav.profile,
              href: "/parent/profile",
              icon: "person",
            },
          ]}
        />
      )}
    </div>
  );
}

export function Title({
  title,
  note,
  action,
}: {
  title: string;
  note?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-heading page-title">
      <div>
        <h1>{title}</h1>
        {note && <p>{note}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">
        ✦
      </span>
      <h2>{title}</h2>
      <p>{note}</p>
      {children}
    </div>
  );
}

export function Pager({
  data,
  query = {},
  base,
  labels = {
    pagination: "Pagination",
    result: "result",
    results: "results",
    page: "Page",
    of: "of",
    unavailable: "This page is no longer available",
    previous: "Previous",
    next: "Next",
    back: "Back to results",
  },
}: {
  data: Page<unknown>;
  query?: Record<string, string>;
  base: string;
  labels?: {
    pagination: string;
    result: string;
    results: string;
    page: string;
    of: string;
    unavailable: string;
    previous: string;
    next: string;
    back: string;
  };
}) {
  const link = (page: number) =>
    `${base}?${new URLSearchParams({ ...query, page: String(page), pageSize: String(data.pageSize) })}`;
  return (
    <nav className="pagination" aria-label={labels.pagination}>
      <span role="status">
        {data.total} {data.total === 1 ? labels.result : labels.results} · {labels.page}{" "}
        {data.page} {labels.of} {Math.max(1, data.pages)}
        {data.page > Math.max(1, data.pages) &&
          ` · ${labels.unavailable}`}
      </span>
      <div>
        {data.page > 1 && (
          <Link className="btn outline small" href={link(data.page - 1)}>
            {labels.previous}
          </Link>
        )}
        {data.page < data.pages && (
          <Link className="btn outline small" href={link(data.page + 1)}>
            {labels.next}
          </Link>
        )}
        {data.page > Math.max(1, data.pages) && (
          <Link
            className="btn outline small"
            href={link(Math.max(1, data.pages))}
          >
            {labels.back}
          </Link>
        )}
      </div>
    </nav>
  );
}
