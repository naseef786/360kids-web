export function notificationHref(
  notice: { kind: string; workspace?: string; subject_id?: string },
  role: string,
): string {
  const base =
    notice.workspace === "family"
      ? "/parent"
      : notice.workspace === "admin"
        ? "/admin"
        : notice.workspace === "provider"
          ? "/partner"
        : role === "admin"
          ? "/admin"
          : role === "provider"
            ? "/partner"
            : "/parent";
  if (notice.kind === "booking")
    return notice.subject_id && /^[0-9a-f-]{36}$/i.test(notice.subject_id)
      ? `${base}/bookings/${notice.subject_id}`
      : base === "/partner" ? "/partner" : base + "/bookings";
  if (notice.kind === "support") return base + "/support";
  if (notice.kind === "correction")
    return base === "/admin" ? "/admin/operations?resource=corrections" : "/partner/programs";
  if (notice.kind === "provider")
    return base === "/admin" ? "/admin/partners" : "/partner/organizations";
  if (notice.kind === "activity")
    return base === "/admin" ? "/admin/programs" : "/partner/programs";
  return base;
}
