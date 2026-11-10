"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API, api, ApiError, auth, date, type Profile } from "@/lib/client";
import { notificationHref } from "@/lib/notification-view";
interface Notice {
  id: string;
  sequence: string;
  kind: string;
  workspace?: string;
  subject_id: string;
  event: string;
  created_at: string;
  read_at: string | null;
}
interface Feed {
  items: Notice[];
  unread: number;
  total: number;
  nextBefore: string | null;
}
type Status =
  | "connecting"
  | "live"
  | "reconnecting"
  | "unavailable"
  | "offline";
const descriptions: Record<string, string> = {
  "request.submitted": "Booking request submitted",
  accept: "Places accepted and held",
  offer: "A revised booking offer is ready",
  "accept-offer": "Revised offer accepted",
  decline: "Booking request declined",
  cancel: "Booking cancelled",
  "booking.expired": "Unpaid booking hold expired",
  proof: "Payment submitted for review",
  verify: "Booking confirmed",
  "provider.applied": "Provider application submitted",
  "provider.approved": "Provider application approved",
  "provider.rejected": "Provider application reviewed",
  "provider.suspended": "Provider access updated",
  "activity.created": "Activity created",
  "activity.updated": "Activity listing updated",
  "session.added": "Activity session added",
  "correction.requested": "Content correction requested",
  "correction.resolved": "Content correction completed",
  "correction.rejected": "Content correction reviewed",
  "support.created": "Support request opened",
  "support.updated": "Support request updated",
  "profile.updated": "Account details updated",
  "child.created": "Child profile added",
  "child.updated": "Child profile updated",
  "child.archived": "Child profile archived",
  "account.deletion_requested": "Account deletion review requested",
  "refund.completed": "Refund recorded as completed",
};
export default function RealtimeNotifications({
  profile,
  onRefresh,
}: {
  profile: Profile;
  onRefresh: () => Promise<void>;
}) {
  const [status, setStatus] = useState<Status>("connecting"),
    [feed, setFeed] = useState<Feed | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [busy, setBusy] = useState(false);
  const mounted = useRef(false);
  const feedVersion = useRef(0),
    menu = useRef<HTMLDetailsElement>(null);
  const fetchFeed = useCallback(async () => {
    const version = ++feedVersion.current;
    try {
      const data = await api<Feed>("/notifications");
      if (mounted.current && feedVersion.current === version) {
        setFeed(data);
        setError("");
      }
    } catch (e) {
      if (mounted.current && feedVersion.current === version) {
        if (e instanceof ApiError && [401, 403].includes(e.status))
          setFeed(null);
        setError(
          e instanceof Error ? e.message : "Unable to load notifications.",
        );
        setStatus(navigator.onLine ? "unavailable" : "offline");
      }
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const invalidate = () => {
      feedVersion.current += 1;
    };
    let disposed = false,
      pending: ReturnType<typeof setTimeout> | undefined,
      refreshing = false,
      again = false;
    const socket = io(API, {
      autoConnect: false,
      auth: (callback) => {
        if (!auth) {
          callback({});
          return;
        }
        void auth.auth
          .getSession()
          .then(({ data }) => callback({ token: data.session?.access_token }))
          .catch(() => callback({}));
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });
    async function refresh() {
      if (disposed) return;
      if (refreshing) {
        again = true;
        return;
      }
      refreshing = true;
      try {
        await Promise.all([fetchFeed(), onRefresh()]);
      } finally {
        refreshing = false;
        if (again && !disposed) {
          again = false;
          schedule();
        }
      }
    }
    function schedule() {
      if (disposed) return;
      if (pending) clearTimeout(pending);
      pending = setTimeout(() => {
        pending = undefined;
        void refresh();
      }, 150);
    }
    socket.on("connect", () => {
      setStatus("live");
      schedule();
    });
    socket.on("sync:required", () => {
      setStatus("live");
      schedule();
    });
    socket.on("sync:unavailable", () => {
      setStatus("unavailable");
    });
    socket.on("disconnect", (reason) => {
      setStatus(
        navigator.onLine
          ? reason === "io server disconnect"
            ? "unavailable"
            : "reconnecting"
          : "offline",
      );
    });
    socket.on("connect_error", () => {
      setStatus(navigator.onLine ? "unavailable" : "offline");
    });
    socket.io.on("reconnect_attempt", () =>
      setStatus(navigator.onLine ? "reconnecting" : "offline"),
    );
    const authSubscription = auth?.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        socket.disconnect();
        return;
      }
      if (session?.user.id !== profile.id) {
        socket.disconnect();
        return;
      }
      if (
        event === "TOKEN_REFRESHED" ||
        (event === "SIGNED_IN" && !socket.connected)
      ) {
        socket.disconnect();
        socket.connect();
      }
    });
    const focus = () => {
      if (document.visibilityState === "visible") schedule();
    };
    const online = () => {
      setStatus("connecting");
      if (!socket.connected) socket.connect();
      schedule();
    };
    const offline = () => setStatus("offline");
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    const fallback = setInterval(() => {
      if (
        !socket.connected &&
        navigator.onLine &&
        document.visibilityState === "visible"
      ) {
        if (!socket.active) socket.connect();
        schedule();
      }
    }, 30000);
    schedule();
    socket.connect();
    return () => {
      disposed = true;
      mounted.current = false;
      invalidate();
      if (pending) clearTimeout(pending);
      clearInterval(fallback);
      authSubscription?.data.subscription.unsubscribe();
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();
    };
  }, [fetchFeed, onRefresh, retry, profile.id]);
  async function mark(ids?: string[]) {
    setBusy(true);
    try {
      await api("/notifications/read", ids ? { ids } : { all: true });
      await fetchFeed();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to update notifications.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function more() {
    if (!feed?.nextBefore) return;
    const version = feedVersion.current;
    setBusy(true);
    try {
      const next = await api<Feed>(
        "/notifications?before=" + encodeURIComponent(feed.nextBefore),
      );
      if (mounted.current && version === feedVersion.current)
        setFeed((current) =>
          current
            ? {
                ...next,
                items: [
                  ...new Map(
                    [...current.items, ...next.items].map((n) => [n.id, n]),
                  ).values(),
                ],
              }
            : next,
        );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to load older notifications.",
      );
    } finally {
      setBusy(false);
    }
  }
  const destination = (notice: Notice) =>
    notificationHref(notice, profile.role);
  const label = {
    connecting: "Connecting live updates",
    live: "Live updates on",
    reconnecting: "Reconnecting…",
    unavailable: "Live updates unavailable",
    offline: "Offline",
  }[status];
  return (
    <div className="realtime-tools">
      <span className={"realtime-status " + status} role="status">
        <span aria-hidden="true" />
        {label}
      </span>
      {["unavailable", "offline"].includes(status) && (
        <button className="text-button" onClick={() => setRetry((v) => v + 1)}>
          Retry live updates
        </button>
      )}
      <details
        ref={menu}
        className="notification-menu"
        onKeyDown={(event) => {
          if (event.key === "Escape" && menu.current?.open) {
            menu.current.open = false;
            menu.current.querySelector("summary")?.focus();
            event.stopPropagation();
          }
        }}
      >
        <summary aria-label={`Notifications, ${feed?.unread ?? 0} unread`}>
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <path d="M6 9a6 6 0 0 1 12 0v6l2 3H4l2-3V9Zm4 12h4" />
          </svg>
          Notifications{" "}
          <span className="notification-count">{feed?.unread ?? 0}</span>
        </summary>
        <section className="notification-feed" aria-label="Notifications">
          <div className="row">
            <strong>Your updates</strong>
            <button
              className="text-button"
              disabled={busy || !feed?.unread}
              onClick={() => void mark()}
            >
              Mark all read
            </button>
          </div>
          <p className="muted">
            Updates are saved in your account. Reconnecting refreshes the latest
            data.
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {!feed && !error && <p role="status">Loading notifications…</p>}
          {feed?.items.length === 0 && (
            <div className="empty">
              <h3>You’re all caught up</h3>
              <p>Booking and account updates will appear here.</p>
            </div>
          )}
          <ol>
            {feed?.items.map((n) => (
              <li className={n.read_at ? "" : "unread"} key={n.id}>
                <Link
                  href={destination(n)}
                  onClick={() => {
                    if (!n.read_at) void mark([n.id]);
                    if (menu.current) menu.current.open = false;
                  }}
                >
                  <strong>
                    {descriptions[n.event] || "Your workspace was updated"}
                  </strong>
                  <small>{date(n.created_at)}</small>
                </Link>
                {!n.read_at && (
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => void mark([n.id])}
                  >
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ol>
          {feed?.nextBefore && (
            <button disabled={busy} onClick={() => void more()}>
              Load older updates
            </button>
          )}
        </section>
      </details>
    </div>
  );
}
