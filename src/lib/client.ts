import { createClient } from "@supabase/supabase-js";
import { createApiClient, ApiError } from "./api-client";
export { ApiError } from "./api-client";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const auth = (() => {
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch {
    return null;
  }
})();
export const API =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:4000");
export const api = createApiClient({
  baseUrl: API,
  getIdentity: async () => {
    if (!auth) return null;
    const { data, error } = await auth.auth.getSession();
    if (error)
      throw new ApiError(
        "Account verification is temporarily unavailable.",
        503,
      );
    const session = data.session;
    return session
      ? { id: session.user.id, token: session.access_token }
      : null;
  },
});
export interface Profile {
  id: string;
  email: string;
  role: string;
  display_name?: string;
}
export interface Child {
  id: string;
  first_name: string;
  surname: string;
  birth_date: string;
}
export interface Provider {
  id: string;
  name: string;
  status: string;
  description: string;
}
export interface Session {
  id: string;
  starts_at: string;
  cutoff_at: string;
}
export interface Activity {
  version: number;
  published: boolean;
  id: string;
  provider_id: string;
  title: string;
  description: string;
  category: string;
  area: string;
  min_age: number;
  max_age: number;
  price_fils: number;
  policy: string;
  provider_name: string;
  sessions: Session[];
}
export interface Booking {
  parent_id: string;
  provider_id: string;
  session_id: string;
  id: string;
  state: string;
  version: number;
  quantity: number;
  amount_fils: number;
  held: boolean;
  response_due_at: string;
  payment_due_at: string | null;
  created_at: string;
  snapshot: {
    title: string;
    provider: string;
    startsAt: string;
    policy: string;
  };
  offer: {
    amountFils: number;
    reason: string;
    expiresAt: string;
    sessionId?: string;
    startsAt?: string;
  } | null;
  children: Child[];
  refunds: { status: string; amount_fils: number }[] | null;
}
export interface Operations {
  providers: Provider[];
  refunds: {
    id: string;
    booking_id: string;
    amount_fils: number;
    status: string;
  }[];
  subscriptions: {
    provider_id: string;
    name: string;
    plan: string;
    expires_at: string;
  }[];
  contacts: {
    id: string;
    name: string;
    phone_suffix: string;
    marketing: string;
    suppressed: boolean;
  }[];
  campaigns: {
    id: string;
    name: string;
    template: string;
    language: string;
    status: string;
  }[];
  audit: {
    id: string;
    action: string;
    created_at: string;
    subject_id: string;
  }[];
  financeEnabled: boolean;
  whatsappEnabled: boolean;
}
export const money = (f: number) =>
  new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" }).format(
    f / 100,
  );
export const date = (s: string) =>
  !s || !Number.isFinite(new Date(s).getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-AE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Dubai",
      }).format(new Date(s));
