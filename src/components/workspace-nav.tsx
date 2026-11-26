"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";

export type WorkspaceLink = {
  label: string;
  href: string;
  icon: string;
};

function isTabActive(path: string, href: string) {
  if (href === "/" || href === "/parent" || href === "/partner" || href === "/admin") {
    return path === href;
  }
  return path === href || path.startsWith(href + "/");
}

export function WorkspaceNav({
  links,
  label,
}: {
  links: WorkspaceLink[];
  label: string;
}) {
  const path = usePathname();
  const [pending, setPending] = useState<{ target: string; fromPath: string } | null>(null);
  const pendingHref = pending && pending.fromPath === path && !isTabActive(path, pending.target) ? pending.target : null;
  const activeHref = pendingHref ?? links.find((l) => isTabActive(path, l.href))?.href ?? null;
  return (
    <nav aria-label={label}>
      {links.map(({ label: title, href, icon }) => (
        <Link
          href={href}
          key={href}
          prefetch={true}
          className={pendingHref === href ? "is-pending" : undefined}
          onPointerDown={() => setPending({ target: href, fromPath: path })}
          onClick={() => setPending({ target: href, fromPath: path })}
          aria-current={activeHref === href ? "page" : undefined}
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
  const [pending, setPending] = useState<{ target: string; fromPath: string } | null>(null);
  const pendingHref = pending && pending.fromPath === path && !isTabActive(path, pending.target) ? pending.target : null;
  const activeHref = pendingHref ?? items.find((item) => isTabActive(path, item.href))?.href ?? null;
  return (
    <nav className="mobile-tabs" aria-label={label}>
      {items.map(({ label: itemLabel, href, icon }) => {
        const active = activeHref === href;
        const isPending = pendingHref === href;
        return (
          <Link
            key={href}
            href={href}
            prefetch={true}
            className={isPending ? "is-pending" : undefined}
            onPointerDown={() => setPending({ target: href, fromPath: path })}
            onClick={() => setPending({ target: href, fromPath: path })}
            aria-current={active ? "page" : undefined}
          >
            <span className="mobile-tab-indicator" aria-hidden="true" />
            <Icon name={icon} />
            <span>{itemLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export const MobileBottomNav = ParentMobileNav;
