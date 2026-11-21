export type BookingIntent = {
  activityId: string;
  sessionId: string;
  sessionPage: number;
  childCount: number;
  expiresAt: number;
};

const key = (activityId: string) => `booking-intent:${activityId}`;
const sevenDays = 7 * 24 * 60 * 60 * 1000;

export function readBookingIntent(storage: Storage, activityId: string, now = Date.now()): BookingIntent | null {
  const raw = storage.getItem(key(activityId));
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) throw new Error("Invalid draft");
    const draft = value as Partial<BookingIntent>;
    if (draft.activityId !== activityId || typeof draft.sessionId !== "string" ||
      !Number.isInteger(draft.sessionPage) || (draft.sessionPage ?? 0) < 1 ||
      !Number.isInteger(draft.childCount) || (draft.childCount ?? 0) < 1 || (draft.childCount ?? 0) > 10 ||
      typeof draft.expiresAt !== "number" || draft.expiresAt <= now || draft.expiresAt > now + sevenDays) {
      throw new Error("Invalid draft");
    }
    return draft as BookingIntent;
  } catch {
    storage.removeItem(key(activityId));
    return null;
  }
}

export function saveBookingIntent(storage: Storage, activityId: string, sessionId: string, sessionPage: number, childCount: number, now = Date.now()) {
  if (!sessionId || !Number.isInteger(sessionPage) || sessionPage < 1 || !Number.isInteger(childCount) || childCount < 1 || childCount > 10) return;
  const previous = readBookingIntent(storage, activityId, now);
  storage.setItem(key(activityId), JSON.stringify({activityId,sessionId,sessionPage,childCount,
    expiresAt: previous?.expiresAt ?? now + sevenDays} satisfies BookingIntent));
}

export function clearBookingIntent(storage: Storage, activityId: string) {
  storage.removeItem(key(activityId));
}
