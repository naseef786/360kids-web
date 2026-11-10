export function notificationHref(
  notice: { kind: string; workspace?: string },
  role: string,
): string {
  const base =
    notice.workspace === "family"
      ? "/account"
      : notice.workspace === "admin"
        ? "/admin"
        : role === "admin"
          ? "/admin"
          : role === "provider"
            ? "/provider"
            : "/account";
  if (notice.kind === "booking")
    return base + (base === "/provider" ? "/requests" : "/bookings");
  if (notice.kind === "support") return base + "/support";
  if (notice.kind === "correction")
    return role === "admin" ? "/admin/corrections" : "/provider/activities";
  if (notice.kind === "provider")
    return role === "admin"
      ? "/admin/providers"
      : role === "provider"
        ? "/provider/profile"
        : "/become-a-provider";
  if (notice.kind === "activity")
    return role === "admin" ? "/admin/activities" : "/provider/activities";
  return base;
}
