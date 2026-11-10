"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/client";
import {
  appendBookingPage,
  bookingPagePath,
  type BookingFilters,
  type BookingPage,
} from "@/lib/booking-pages";
import type { Booking } from "@/lib/client";
const statuses = {
  all: "All statuses",
  attention: "Needs attention",
  REQUESTED: "Awaiting provider",
  OFFER_PENDING: "Awaiting parent",
  PAYMENT_DUE: "Payment due",
  PAYMENT_CHECKING: "Payment being checked",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};
interface Resource {
  endpoint: string;
  revision: number;
  attempt: number;
  page: BookingPage | null;
  error: string;
  loadingMore: boolean;
}
export default function BookingBrowser({
  scope,
  revision,
  children,
}: {
  scope: BookingFilters["scope"];
  revision: number;
  children: (bookings: Booking[]) => ReactNode;
}) {
  const [state, setState] = useState("all"),
    [search, setSearch] = useState(""),
    [draft, setDraft] = useState(""),
    [retry, setRetry] = useState(0);
  const endpoint = bookingPagePath({ scope, state, search });
  const [resource, setResource] = useState<Resource>({
    endpoint: "",
    revision: -1,
    attempt: -1,
    page: null,
    error: "",
    loadingMore: false,
  });
  const generation = useRef(0),
    controller = useRef<AbortController | null>(null),
    appending = useRef(false);
  useEffect(() => {
    const version = ++generation.current;
    const request = new AbortController();
    controller.current?.abort();
    controller.current = request;
    appending.current = false;
    void api<BookingPage>(endpoint, undefined, { signal: request.signal })
      .then((page) => {
        if (!request.signal.aborted && version === generation.current)
          setResource({
            endpoint,
            revision,
            attempt: retry,
            page,
            error: "",
            loadingMore: false,
          });
      })
      .catch((error) => {
        if (!request.signal.aborted && version === generation.current)
          setResource({
            endpoint,
            revision,
            attempt: retry,
            page: null,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load bookings.",
            loadingMore: false,
          });
      });
    return () => {
      request.abort();
      controller.current?.abort();
    };
  }, [endpoint, revision, retry]);
  const current =
    resource.endpoint === endpoint &&
    resource.revision === revision &&
    resource.attempt === retry;
  const page = current ? resource.page : null;
  async function more() {
    if (!current || !page?.nextCursor || appending.current) return;
    appending.current = true;
    const version = generation.current,
      request = new AbortController();
    controller.current = request;
    setResource((r) => ({ ...r, loadingMore: true, error: "" }));
    try {
      const next = await api<BookingPage>(
        bookingPagePath({ scope, state, search }, page.nextCursor),
        undefined,
        { signal: request.signal },
      );
      if (!request.signal.aborted && version === generation.current)
        setResource({
          endpoint,
          revision,
          attempt: retry,
          page: appendBookingPage(page, next),
          error: "",
          loadingMore: false,
        });
    } catch (error) {
      if (!request.signal.aborted && version === generation.current)
        setResource((r) => ({
          ...r,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load more bookings.",
          loadingMore: false,
        }));
    } finally {
      if (version === generation.current) appending.current = false;
    }
  }
  return (
    <section className="booking-browser" aria-label="Booking records">
      <form
        className="booking-tools"
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(draft.trim());
          setRetry((v) => v + 1);
        }}
      >
        <label>
          Booking status
          <select
            value={state}
            onChange={(event) => setState(event.target.value)}
          >
            {Object.entries(statuses).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Find a booking
          <input
            type="search"
            maxLength={100}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Activity, provider or booking reference"
          />
        </label>
        <button type="submit">Search</button>
        {(search || state !== "all") && (
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setDraft("");
              setSearch("");
              setState("all");
            }}
          >
            Clear filters
          </button>
        )}
      </form>
      <div aria-live="polite" aria-atomic="true">
        {page ? (
          <p>
            Showing {page.items.length} of {page.total} matching bookings ·
            newest first.
          </p>
        ) : !current || !resource.error ? (
          <p role="status">Loading bookings…</p>
        ) : null}
      </div>
      {current && resource.error && (
        <p className="notice" role="alert">
          {resource.error}{" "}
          <button
            type="button"
            onClick={() => (page ? void more() : setRetry((v) => v + 1))}
          >
            Retry
          </button>
        </p>
      )}
      {page &&
        (page.items.length ? (
          children(page.items)
        ) : (
          <div className="empty">
            <h2>No matching bookings</h2>
            <p>
              {search || state !== "all"
                ? "Try another search or clear the filters."
                : "Your requests and confirmed activities will appear here."}
            </p>
          </div>
        ))}
      {page?.nextCursor && (
        <button
          type="button"
          disabled={resource.loadingMore}
          onClick={() => void more()}
        >
          {resource.loadingMore ? "Loading more…" : "Load more bookings"}
        </button>
      )}
    </section>
  );
}
