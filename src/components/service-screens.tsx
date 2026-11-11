import Link from "next/link";
import { pageQuery, type Search } from "@/lib/page-query";
import { backend, identity, requireIdentity } from "@/lib/server-api";
import { serverDictionary } from "@/lib/server-locale";
import { serviceCopy } from "@/lib/service-copy";
import { dateTime, type Page } from "@/lib/types";
import {
  ContentForm,
  SupportForm,
  type ContentPage,
  type Ticket,
} from "./service-forms";
import { Empty, Pager, Shell, Title } from "./shell";

export const contentSlugs = ["about", "contact", "faq", "terms", "privacy"];

export async function PublicPage({ slug }: { slug: string }) {
  const [session, page] = await Promise.all([
    identity(),
    backend<ContentPage | null>(`/content/${slug}`),
  ]);
  return (
    <Shell actor={session?.actor} publicPage>
      <Title title={page?.title ?? slug[0].toUpperCase() + slug.slice(1)} />
      {page ? (
        <article
          className="panel"
          style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
        >
          {page.body}
        </article>
      ) : (
        <Empty
          title="Content is being prepared"
          note="The team has not published this page yet."
        />
      )}
    </Shell>
  );
}

export async function ContentScreen({ searchParams }: { searchParams: Search }) {
  const { actor, token } = await requireIdentity("/admin/content", "superadmin");
  const query = await searchParams;
  const slug =
    typeof query.slug === "string" && contentSlugs.includes(query.slug)
      ? query.slug
      : "about";
  const page = await backend<ContentPage | null>(`/manage/content/${slug}`, token);
  return (
    <Shell actor={actor} role="admin">
      <Title
        title="Website content"
        note="Publish reviewed content only. Pages display plain text."
      />
      <nav className="status-tabs" aria-label="Website pages">
        {contentSlugs.map((item) => (
          <Link
            key={item}
            href={`/admin/content?slug=${item}`}
            aria-current={item === slug ? "page" : undefined}
          >
            {item}
          </Link>
        ))}
      </nav>
      <section className="panel section-gap">
        <ContentForm key={`${slug}-${page?.version}`} slug={slug} page={page} />
      </section>
      <Link href={`/${slug}`} className="text-link">
        View public page
      </Link>
    </Shell>
  );
}

export async function SupportScreen({
  role,
  searchParams,
}: {
  role: "parent" | "partner" | "admin";
  searchParams: Search;
}) {
  const base = `/${role}/support`;
  const [{ actor, token }, { locale }] = await Promise.all([
    requireIdentity(
      base,
      role === "admin" ? "superadmin" : role === "partner" ? "partner" : undefined,
    ),
    serverDictionary(),
  ]);
  const copy = serviceCopy[locale];
  const input = await pageQuery(searchParams, ["status"], {
    status: ["open", "in_progress", "resolved"],
  });
  const query: Record<string, string> = {
    page: input.page,
    pageSize: input.pageSize,
  };
  if (["open", "in_progress", "resolved"].includes(input.status))
    query.status = input.status;
  const data = await backend<Page<Ticket>>(
    `/support?${new URLSearchParams(query)}`,
    token,
  );
  return (
    <Shell actor={actor} role={role}>
      <Title title={copy.support.title} note={copy.support.note} />
      <form className="filters" action={base}>
        <label>
          {copy.support.status}
          <select name="status" defaultValue={query.status ?? ""}>
            <option value="">{copy.support.allStatuses}</option>
            {(["open", "in_progress", "resolved"] as const).map((status) => (
              <option key={status} value={status}>
                {copy.support.statuses[status]}
              </option>
            ))}
          </select>
        </label>
        <button className="btn">{copy.support.applyFilter}</button>
      </form>
      <div className="stack section-gap">
        {data.items.map((ticket) => (
          <article className="record-card" key={ticket.id}>
            <span className="badge aqua">
              {copy.support.statuses[
                ticket.status as keyof typeof copy.support.statuses
              ] ?? ticket.status}
            </span>
            <h2>{copy.support.topics[ticket.topic] ?? ticket.topic}</h2>
            <p className="fine-print">{dateTime(ticket.created_at, locale)}</p>
            <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {ticket.message}
            </p>
            {ticket.reply && (
              <div className="notice">
                <strong>{copy.support.teamResponse}</strong>
                <p style={{ whiteSpace: "pre-wrap" }}>{ticket.reply}</p>
              </div>
            )}
            {role === "admin" && (
              <SupportForm
                key={`${ticket.id}-${ticket.status}-${ticket.reply}`}
                ticket={ticket}
                copy={copy.support}
              />
            )}
          </article>
        ))}
      </div>
      {!data.items.length && (
        <Empty title={copy.support.emptyTitle} note={copy.support.emptyNote} />
      )}
      <Pager data={data} query={query} base={base} labels={copy.pager} />
      {role !== "admin" && (
        <section className="panel section-gap">
          <h2>{copy.support.helpTitle}</h2>
          <SupportForm copy={copy.support} />
        </section>
      )}
    </Shell>
  );
}
