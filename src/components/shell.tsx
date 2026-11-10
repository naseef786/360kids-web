import Image from "next/image";
import Link from "next/link";
import { WorkspaceNav, ParentMobileNav } from "./workspace-nav";
import { SignOut } from "./account-controls";
import type { Identity, Page } from "@/lib/types";
import "./workspace.css";
import "./connected.css";
export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="360 Kids Activity home">
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
export function Header({ actor }: { actor?: Identity | null }) {
  return (
    <header className="app-header">
      <Brand />
      <nav className="public-nav" aria-label="Website">
        <Link href="/parent/activities">Explore</Link>
        <Link href="/#categories">Categories</Link>
        <Link href="/#how-it-works">How it works</Link>
      </nav>
      <div className="header-actions">
        {actor ? (
          <>
            <nav className="role-links" aria-label="Your workspaces">
              <Link href="/parent">Parent</Link>
              {actor.roles.includes("partner") && (
                <Link href="/partner">Partner</Link>
              )}
              {actor.roles.includes("superadmin") && (
                <Link href="/admin">Superadmin</Link>
              )}
            </nav>
            <SignOut />
          </>
        ) : (
          <>
            <Link className="btn outline" href="/login">
              Sign in
            </Link>
            <Link className="btn" href="/partner/apply">
              Become a partner
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="app-footer">
      <span>360 Kids Activity · Explore. Play. Grow.</span>
      <span>Dubai, United Arab Emirates</span>
    </footer>
  );
}
export function Shell({
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
  const links =
    role === "parent"
      ? [
          ["Overview", "/parent"],
          ["Explore activities", "/parent/activities"],
          ["My bookings", "/parent/bookings"],
          ["Children & account", "/parent/profile"],
          ["Saved activities", "/parent/saved"],
          ["Become a partner", "/partner/apply"],
        ]
      : role === "partner"
        ? [
            ["Requests", "/partner"],
            ["Listings", "/partner/programs"],
            ["My organizations", "/partner/organizations"],
            ["Team access", "/partner/team"],
          ]
        : [
            ["Overview", "/admin"],
            ["Provider reviews", "/admin/partners"],
            ["Catalogue", "/admin/programs"],
            ["All bookings", "/admin/bookings"],
            ["Corrections & audit", "/admin/operations"],
          ];
  return (
    <div className="platform">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header actor={actor} />
      <div className={publicPage ? "discovery-main" : "workspace-layout"}>
        {!publicPage && (
          <aside className="workspace-sidebar">
            <p className="sidebar-label">
              {role === "parent"
                ? "YOUR FAMILY"
                : role === "partner"
                  ? "PARTNER WORKSPACE"
                  : "SUPERADMIN"}
            </p>
            <WorkspaceNav links={links} />
            {actor && (
              <div className="sidebar-foot">
                <div>
                  <b>
                    {role === "parent"
                      ? "Your family"
                      : role === "partner"
                        ? "Partner account"
                        : "Platform team"}
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
            <span>Development</span>Use fictional family details while we
            prepare for launch.
          </p>
          {children}
          <Footer />
        </main>
      </div>
      {role === "parent" && <ParentMobileNav />}
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
}: {
  data: Page<unknown>;
  query?: Record<string, string>;
  base: string;
}) {
  const link = (page: number) =>
    `${base}?${new URLSearchParams({ ...query, page: String(page), pageSize: String(data.pageSize) })}`;
  return (
    <nav className="pagination" aria-label="Pagination">
      <span role="status">
        {data.total} {data.total === 1 ? "result" : "results"} · Page{" "}
        {data.page} of {Math.max(1, data.pages)}
      </span>
      <div>
        {data.page > 1 && (
          <Link className="btn outline small" href={link(data.page - 1)}>
            Previous
          </Link>
        )}
        {data.page < data.pages && (
          <Link className="btn outline small" href={link(data.page + 1)}>
            Next
          </Link>
        )}
      </div>
    </nav>
  );
}
