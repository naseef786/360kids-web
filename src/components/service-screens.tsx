import Link from "next/link";
import { pageQuery, type Search } from "@/lib/page-query";
import { backend, identity, requireIdentity } from "@/lib/server-api";
import { serverDictionary } from "@/lib/server-locale";
import { serviceCopy } from "@/lib/service-copy";
import { dateTime, type Page } from "@/lib/types";
import { displayReference } from "@/lib/display-reference";
import {
  ContentForm,
  SupportForm,
  type ContentPage,
  type Ticket,
  ContactStatusForm,
  type ContactSubmission,
} from "./service-forms";
import { Empty, Pager, Shell, Title } from "./shell";
import { ContactForm } from "./contact-form";

export const contentSlugs = ["about", "contact", "faq", "terms", "privacy"];

export async function PublicPage({ slug }: { slug: string }) {
  const [session, page, {locale}] = await Promise.all([
    identity(),
    backend<ContentPage | null>(`/content/${slug}`),
    serverDictionary(),
  ]);
  if(slug==="contact") return <Shell actor={session?.actor} publicPage>
    <div className="contact-page">
      <header className="contact-hero">
        <div className="contact-hero-copy">
          <span className="contact-kicker">{locale==="ar"?"360 Kids Activity • تواصل معنا":"360 Kids Activity · Get in touch"}</span>
          <h1>{locale==="ar"?"لنبدأ الحديث":"Let’s start a conversation."}</h1>
          <p>{locale==="ar"?"هل لديك سؤال عن الأنشطة أو الحجوزات أو الشراكة؟ يسعد فريقنا في دبي بمساعدتك.":"Questions about activities, a booking request, or partnering with us? Our Dubai team is here to help."}</p>
          <a className="contact-hero-link" href="#contact-form">{locale==="ar"?"أرسل لنا رسالة":"Send a message"} <span aria-hidden="true">↗</span></a>
        </div>
        <div className="contact-hero-image" role="img" aria-label={locale==="ar"?"أنشطة الأطفال":"Children enjoying an activity"} />
      </header>
      <div className="contact-layout">
        <section className="contact-form-card" id="contact-form" aria-labelledby="contact-form-title">
          <div className="contact-section-heading">
            <span className="contact-kicker">{locale==="ar"?"الرسائل":"YOUR MESSAGE"}</span>
            <h2 id="contact-form-title">{locale==="ar"?"كيف يمكننا مساعدتك؟":"How can we help?"}</h2>
            <p>{locale==="ar"?"اكتب سؤالك وسنرد عليك عبر البريد الإلكتروني.":"Tell us what’s on your mind. We’ll reply to the email address you provide."}</p>
          </div>
          <ContactForm locale={locale}/>
        </section>
        <aside className="contact-sidebar" aria-labelledby="contact-details-title">
          <div className="contact-sidebar-intro">
            <span className="contact-kicker">{locale==="ar"?"بيانات التواصل":"OTHER WAYS TO REACH US"}</span>
            <h2 id="contact-details-title">{locale==="ar"?"نحن هنا لمساعدتك":"We’re here to help."}</h2>
            <p>{locale==="ar"?"اختر طريقة التواصل المناسبة لك.":"Choose the way that works best for you."}</p>
          </div>
          <div className="contact-methods">
            <a className="contact-method" href="tel:+971558883305">
              <span className="contact-method-number" aria-hidden="true">01</span>
              <span><strong>{locale==="ar"?"اتصل بنا":"Call us"}</strong><span>+971 55 888 3305</span></span>
              <span className="contact-method-arrow" aria-hidden="true">↗</span>
            </a>
            <a className="contact-method" href="mailto:info@360kidsactivity.com">
              <span className="contact-method-number" aria-hidden="true">02</span>
              <span><strong>{locale==="ar"?"راسلنا":"Email us"}</strong><span>info@360kidsactivity.com</span></span>
              <span className="contact-method-arrow" aria-hidden="true">↗</span>
            </a>
            <div className="contact-method">
              <span className="contact-method-number" aria-hidden="true">03</span>
              <span><strong>{locale==="ar"?"موقعنا":"Based in"}</strong><span>{locale==="ar"?"دبي، الإمارات العربية المتحدة":"Dubai, UAE"}</span></span>
            </div>
          </div>
          <div className="contact-help-card">
            <span className="contact-help-mark" aria-hidden="true">?</span>
            <div><h3>{locale==="ar"?"تبحث عن إجابة سريعة؟":"Looking for a quick answer?"}</h3>
            <p>{locale==="ar"?"اطلع على الأسئلة الشائعة قبل إرسال رسالتك.":"Our frequently asked questions may already have what you need."}</p>
            <Link href="/faq">{locale==="ar"?"تصفح الأسئلة الشائعة":"Browse FAQs"} <span aria-hidden="true">→</span></Link></div>
          </div>
        </aside>
      </div>
    </div>
  </Shell>;
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

export async function ContactInboxScreen({searchParams}:{searchParams:Search}) {
  const [{actor,token},{locale}]=await Promise.all([
    requireIdentity("/admin/contact-submissions","superadmin"),serverDictionary(),
  ]);
  const query=await pageQuery(searchParams,["status"],{status:["open","in_progress","resolved"]});
  const data=await backend<Page<ContactSubmission>>(`/admin/contact-submissions?${new URLSearchParams(query)}`,token);
  return <Shell actor={actor} role="admin">
    <Title title={locale==="ar"?"رسائل التواصل":"Contact messages"} note="Public website enquiries are private to authorized support operators. Reply using the address supplied by the visitor; no email is sent automatically."/>
    <form className="filters" action="/admin/contact-submissions">
      <label>Status<select name="status" defaultValue={query.status??""}>
        <option value="">All</option>{["open","in_progress","resolved"].map(status=><option key={status} value={status}>{status.replace("_"," ")}</option>)}
      </select></label><button className="btn">Filter</button>
    </form>
    <div className="stack section-gap">{data.items.map(item=><article className="record-card" key={item.id}>
      <span className="badge aqua">{item.status.replace("_"," ")}</span>
      <p className="fine-print">Reference: {displayReference("contact",item.id)}</p>
      <h2>{item.topic}</h2>
      <p>{item.name} · <a href={`mailto:${item.email}`}>{item.email}</a></p>
      <p className="fine-print">{dateTime(item.created_at,locale)} · Email notice: {item.email_status.replace("_"," ")}{item.email_attempts>0?` (${item.email_attempts} attempts)`:""}</p>
      <p className="fine-print">Thank-you email: {item.ack_status?.replace("_"," ") ?? "not queued"}{item.ack_attempts ? ` (${item.ack_attempts} attempts)` : ""}</p>
      <p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{item.message}</p>
      <ContactStatusForm item={item}/>
    </article>)}</div>
    {!data.items.length&&<Empty title="No contact messages" note="New website enquiries will appear here."/>}
    <Pager data={data} query={query} base="/admin/contact-submissions" labels={serviceCopy[locale].pager}/>
  </Shell>;
}
