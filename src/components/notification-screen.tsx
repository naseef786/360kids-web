import Link from "next/link";
import { notificationHref } from "@/lib/notification-view";
import { pageQuery, type Search } from "@/lib/page-query";
import { backend, requireIdentity } from "@/lib/server-api";
import { serverDictionary } from "@/lib/server-locale";
import { notificationEventLabel, serviceCopy } from "@/lib/service-copy";
import { type Page, dateTime } from "@/lib/types";
import { MarkNotificationsRead } from "./notification-controls";
import { Empty, Pager, Shell, Title } from "./shell";

type Notice = {
  id: string;
  subject_id: string;
  kind: string;
  workspace: string;
  event: string;
  read_at: string | null;
  created_at: string;
};

export async function NotificationScreen({
  role,
  searchParams,
}: {
  role: "parent" | "partner" | "admin";
  searchParams: Search;
}) {
  const base = `/${role}/notifications`;
  const [{ actor, token }, { locale }] = await Promise.all([
    requireIdentity(
      base,
      role === "admin" ? "superadmin" : role === "partner" ? "partner" : undefined,
    ),
    serverDictionary(),
  ]);
  const copy = serviceCopy[locale];
  const query = await pageQuery(searchParams);
  const feed = await backend<Page<Notice> & { unread: number }>(
    `/notifications?${new URLSearchParams(query)}`,
    token,
  );
  return (
    <Shell actor={actor} role={role}>
      <Title
        title={copy.notifications.title}
        note={`${copy.notifications.unreadUpdates(feed.unread)} ${copy.notifications.refreshNote}`}
      />
      {feed.unread > 0 && (
        <section className="panel">
          <MarkNotificationsRead
            label={copy.notifications.markAllRead}
            pendingLabel={copy.support.saving}
            successMessage={copy.support.saved}
          />
        </section>
      )}
      <div className="stack section-gap">
        {feed.items.map((notice) => (
          <article className="record-card" key={notice.id}>
            <span className="badge aqua">
              {notice.read_at ? copy.notifications.read : copy.notifications.unread}
            </span>
            <h2>{notificationEventLabel(locale, notice.event)}</h2>
            <p className="record-meta">
              {dateTime(notice.created_at, locale)} · {copy.notifications.dubaiTime}
            </p>
            <Link
              className="text-link"
              href={notificationHref(notice, actor.role)}
            >
              {copy.notifications.viewUpdate}
            </Link>
            {!notice.read_at && (
              <MarkNotificationsRead
                ids={[notice.id]}
                label={copy.notifications.markRead}
                pendingLabel={copy.support.saving}
                successMessage={copy.support.saved}
              />
            )}
          </article>
        ))}
      </div>
      {!feed.items.length && (
        <Empty
          title={copy.notifications.emptyTitle}
          note={copy.notifications.emptyNote}
        />
      )}
      <Pager data={feed} query={query} base={base} labels={copy.pager} />
    </Shell>
  );
}
