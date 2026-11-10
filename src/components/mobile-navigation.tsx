"use client";
import Link from "next/link";
const items = [
  { label: "Home", href: "/", icon: "M3 10.5 12 3l9 7.5M5 9v12h5v-7h4v7h5V9" },
  {
    label: "Explore",
    href: "/activities",
    icon: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  },
  {
    label: "Bookings",
    href: "/account/bookings",
    icon: "M5 5h14v16H5zM8 2v6M16 2v6M5 10h14M8 14h3M8 17h6",
  },
  {
    label: "Children",
    href: "/account/children",
    icon: "M9 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0M21 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0M1 21v-3a5 5 0 0 1 10 0v3M13 21v-2a5 5 0 0 1 10 0v2",
  },
  {
    label: "Account",
    href: "/account",
    icon: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2a8 8 0 0 1 16 0v2",
  },
];
export default function MobileNavigation({ path }: { path: string }) {
  const active = path.startsWith("/activities")
    ? "/activities"
    : path.startsWith("/account/bookings")
      ? "/account/bookings"
      : path.startsWith("/account/children")
        ? "/account/children"
        : path.startsWith("/account")
          ? "/account"
          : path === "/"
            ? "/"
            : null;
  return (
    <nav className="mobile-bottom-nav" aria-label="Family navigation">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={active === item.href ? "page" : undefined}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d={item.icon} />
          </svg>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
