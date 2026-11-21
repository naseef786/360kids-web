import type { Identity } from "./types";

export type Capability = "bookings.read" | "bookings.override" | "payments.read" |
  "payments.verify" | "refunds.complete" | "support.manage" | "content.manage";

/** Presentation only. The backend rechecks every action against current grants. */
export function hasCapability(actor: Identity | null | undefined, capability: Capability) {
  return actor?.capabilities?.includes(capability) === true;
}

export function operationsResources(actor: Identity) {
  return [
    ...(hasCapability(actor, "content.manage") ? ["corrections"] : []),
    ...(hasCapability(actor, "payments.read") ? ["refunds", "subscriptions"] : []),
    ...(actor.roles.includes("superadmin") ? [
      ...(hasCapability(actor, "payments.read") ? ["audit"] : []),
      "contacts", "campaigns",
    ] : []),
  ];
}

export function canUseAdminPath(actor: Identity, path: string): boolean {
  const pathname = path.split("?", 1)[0];
  if (pathname === "/admin" || pathname === "/admin/notifications")
    return actor.roles.includes("superadmin") ||
      ["bookings.read", "content.manage", "support.manage", "payments.read"].some(c => actor.capabilities?.includes(c));
  if (pathname === "/admin/partners") return actor.roles.includes("superadmin");
  if (pathname === "/admin/programs" || pathname === "/admin/content") return hasCapability(actor, "content.manage");
  if (pathname === "/admin/support" || pathname === "/admin/contact-submissions") return hasCapability(actor, "support.manage");
  if (pathname === "/admin/bookings" || pathname.startsWith("/admin/bookings/")) return hasCapability(actor, "bookings.read");
  if (pathname === "/admin/operations") {
    const resource = new URL(path,"https://local.invalid").searchParams.get("resource");
    return resource ? operationsResources(actor).includes(resource) : operationsResources(actor).length > 0;
  }
  return false;
}

export function operatorHome(actor: Identity): string {
  if (actor.roles.includes("superadmin")) return "/admin";
  if (hasCapability(actor, "bookings.read")) return "/admin/bookings";
  if (hasCapability(actor, "content.manage")) return "/admin/programs";
  if (hasCapability(actor, "support.manage")) return "/admin/support";
  if (hasCapability(actor, "payments.read")) return "/admin/operations";
  return "/parent";
}

export function bookingControls(actor: Identity, mode: "parent" | "partner" | "admin") {
  return {
    respond: mode === "partner" || (mode === "admin" && hasCapability(actor, "bookings.override")),
    override: mode === "admin" && hasCapability(actor, "bookings.override"),
    verify: mode === "admin" && hasCapability(actor, "payments.verify"),
    steppedUp: actor.assuranceLevel === "aal2",
  };
}
