"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";

export type WorkspaceLink = {
  label: string;
  href: string;
  icon: string;
};

export function WorkspaceNav({
  links,
  label,
}: {
  links: WorkspaceLink[];
  label: string;
}) {
  const path = usePathname();
  return (
    <nav aria-label={label}>
      {links.map(({ label: title, href, icon }) => (
        <Link
          href={href}
          key={href}
          aria-current={path === href ? "page" : undefined}
        >
          <Icon name={icon} />
          {title}
        </Link>
      ))}
    </nav>
  );
}

export function ParentMobileNav({
  label,
  items,
}: {
  label: string;
  items: WorkspaceLink[];
}) {
  const path = usePathname();
  return (
    <nav className="mobile-tabs" aria-label={label}>
      {items.map(({ label: itemLabel, href, icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={
            path === href || path.startsWith(href + "/") ? "page" : undefined
          }
        >
          <Icon name={icon} />
          {itemLabel}
        </Link>
      ))}
    </nav>
  );
}
