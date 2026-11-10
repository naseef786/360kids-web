import type { Booking } from "./client";
export interface BookingPage {
  items: Booking[];
  total: number;
  counts: Record<string, number>;
  nextCursor: string | null;
}
export interface BookingFilters {
  scope: "all" | "family" | "provider";
  state: string;
  search: string;
}
export function bookingPagePath(
  filters: BookingFilters,
  cursor?: string | null,
) {
  const query = new URLSearchParams({ ...filters, limit: "25" });
  if (cursor) query.set("cursor", cursor);
  return "/bookings/page?" + query;
}
export function appendBookingPage(
  previous: BookingPage,
  next: BookingPage,
): BookingPage {
  // Refreshes can overlap an append. Keep one current copy per booking ID.
  const byId = new Map(previous.items.map((booking) => [booking.id, booking]));
  for (const booking of next.items) byId.set(booking.id, booking);
  return { ...next, items: [...byId.values()] };
}
