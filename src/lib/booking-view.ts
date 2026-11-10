import type { Booking } from "./client";
export function bookingDeadline(booking: Booking): string | null {
  if (booking.state === "REQUESTED") return booking.response_due_at;
  if (booking.state === "OFFER_PENDING")
    return booking.offer?.expiresAt ?? null;
  if (booking.state === "PAYMENT_DUE") return booking.payment_due_at;
  return null;
}
export function bookingIsOverdue(booking: Booking, now: number): boolean {
  const deadline = bookingDeadline(booking);
  return deadline !== null && Date.parse(deadline) <= now;
}
export function visibleInWorkspace(
  booking: Booking,
  workspace: "family" | "provider" | "admin",
  userId: string | undefined,
  providerIds: string[],
): boolean {
  return workspace === "family"
    ? booking.parent_id === userId
    : workspace === "provider"
      ? providerIds.includes(booking.provider_id)
      : true;
}
