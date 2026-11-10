export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
};
export type Identity = {
  id: string;
  email: string;
  role: string;
  roles: string[];
  active: boolean;
};
export type Session = {
  id: string;
  starts_at: string;
  cutoff_at: string;
  capacity: number;
  allocated: number;
};
export type Activity = {
  id: string;
  provider_id: string;
  provider_name: string;
  title: string;
  description: string;
  category: string;
  area: string;
  min_age: number;
  max_age: number;
  price_fils: number;
  policy: string;
  published: boolean;
  sessions?: Session[];
};
export type Child = {
  id: string;
  first_name: string;
  surname: string;
  birth_date: string | null;
  age_years: number | null;
  age_recorded_on: string | null;
};
export type Provider = {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  status: string;
};
export type Member = {
  user_id: string;
  email: string;
  role: string;
  active: boolean;
};
export type Booking = {
  id: string;
  parent_id: string;
  provider_id: string;
  state: string;
  version: number;
  amount_fils: number;
  quantity: number;
  response_due_at: string;
  payment_due_at: string | null;
  snapshot: {
    title: string;
    provider: string;
    startsAt: string;
    policy: string;
    children: { id: string; firstName: string }[];
  };
  offer: { amountFils: number; reason?: string; expiresAt: string } | null;
  payments?: { status: string; reference: string }[] | null;
  refunds?: { status: string; amount_fils: number }[] | null;
};
export type Operations = {
  counts: {
    pending_providers: number;
    draft_activities: number;
    open_requests: number;
    pending_refunds: number;
  };
  financeEnabled: boolean;
  whatsappEnabled: boolean;
};
export const money = (fils: number) =>
  new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" }).format(
    fils / 100,
  );
export const dateTime = (value: string) =>
  new Intl.DateTimeFormat("en-AE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dubai",
  }).format(new Date(value));
export const stateLabel = (state: string) =>
  ({
    REQUESTED: "Awaiting provider",
    OFFER_PENDING: "Offer ready",
    PAYMENT_DUE: "Awaiting payment",
    PAYMENT_CHECKING: "Payment under review",
    CONFIRMED: "Confirmed",
    DECLINED: "Declined",
    EXPIRED: "Expired",
    CANCELLED: "Cancelled",
  })[state] ?? state;
