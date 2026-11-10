"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";
const icons: Record<string, string> = {
  Overview: "home",
  "Explore activities": "search",
  "My bookings": "calendar",
  "Children & account": "person",
  "Saved activities": "heart",
  "Become a partner": "grid",
  Requests: "calendar",
  Listings: "grid",
  "My organizations": "home",
  "Team access": "person",
  "Provider reviews": "person",
  Catalogue: "grid",
  "All bookings": "calendar",
  "Corrections & audit": "check",
};
export function WorkspaceNav({ links }: { links: string[][] }) {
  const path = usePathname();
  return (
    <nav aria-label="Workspace navigation">
      {links.map(([title, href]) => (
        <Link
          href={href}
          key={href}
          aria-current={path === href ? "page" : undefined}
        >
          <Icon name={icons[title] ?? "grid"} />
          {title}
        </Link>
      ))}
    </nav>
  );
}
export function ParentMobileNav() {
  const path = usePathname();
  return (
    <nav className="mobile-tabs" aria-label="Parent navigation">
      {[
        ["Explore", "/parent/activities", "home"],
        ["Saved", "/parent/saved", "heart"],
        ["Bookings", "/parent/bookings", "calendar"],
        ["Profile", "/parent/profile", "person"],
      ].map(([label, href, icon]) => (
        <Link
          key={href}
          href={href}
          aria-current={
            path === href || path.startsWith(href + "/") ? "page" : undefined
          }
        >
          <Icon name={icon} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
