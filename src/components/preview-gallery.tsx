"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { money } from "@/lib/types";
import { previewActivities, previewAdminQueue, previewBookings, previewProviderQueue } from "@/lib/preview-data";
import "./preview-gallery.css";

const categories = ["All", ...new Set(previewActivities.map((activity) => activity.category))];

export function PreviewGallery() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const filtered = useMemo(() => previewActivities.filter((activity) =>
    (category === "All" || activity.category === category) &&
    `${activity.title} ${activity.provider} ${activity.area}`.toLowerCase().includes(query.trim().toLowerCase()),
  ), [category, query]);

  return <div className="preview-page">
    <section className="preview-hero">
      <span className="sample-tag">Fictional development preview</span>
      <h1>Explore the 360 Kids interface</h1>
      <p>These examples are synthetic and stay in the browser. They are not live listings, bookings, availability, payments or provider accounts.</p>
    </section>

    <section className="preview-section" aria-labelledby="preview-activities-title">
      <div className="preview-heading"><div><span className="eyebrow">FAMILY VIEW</span><h2 id="preview-activities-title">Activity discovery</h2></div><span>{filtered.length} {filtered.length === 1 ? "example" : "examples"}</span></div>
      <div className="preview-filters">
        <label>Search examples<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Activity, provider or area" /></label>
        <label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      {filtered.length ? <div className="activity-grid">{filtered.map((activity) => <article className="activity-card" key={activity.id}>
        <div className="activity-image"><Image src={`/activities/${activity.image}.jpg`} alt="" width={1024} height={600} sizes="(max-width:650px) 90vw, 30vw" loading={activity.id === "art-lab" ? "eager" : "lazy"} /></div>
        <div className="activity-body"><span className="badge aqua">{activity.category}</span><h3 className="section-gap">{activity.title}</h3><p>{activity.provider} · {activity.area}</p><p>{activity.description}</p><div className="activity-facts"><span>Ages {activity.ages}</span></div><div className="activity-commercial"><span>Illustrative price per child</span><strong>{money(activity.priceFils)}</strong></div><span className="sample-tag">Preview only · cannot request</span></div>
      </article>)}</div> : <p className="notice" role="status">No examples match. Try a different search or category.</p>}
    </section>

    <section className="preview-section" aria-labelledby="preview-bookings-title"><div className="preview-heading"><div><span className="eyebrow">FAMILY VIEW</span><h2 id="preview-bookings-title">Request progress</h2></div></div>
      <div className="preview-status-grid">{previewBookings.map((booking) => <article className="panel preview-status" key={booking.reference}><span className="sample-tag">{booking.reference} · fictional</span><h3>{booking.activity}</h3><strong>{booking.status}</strong><dl><div><dt>Do I have a place?</dt><dd>{booking.place}</dd></div><div><dt>What do I do?</dt><dd>{booking.action}</dd></div><div><dt>By when?</dt><dd>{booking.deadline}</dd></div></dl></article>)}</div>
    </section>

    <div className="preview-queues"><section className="preview-section" aria-labelledby="preview-provider-title"><span className="eyebrow">PROVIDER VIEW</span><h2 id="preview-provider-title">Incoming requests</h2><div className="preview-queue">{previewProviderQueue.map((item) => <article className="panel" key={item.reference}><span className="sample-tag">{item.reference}</span><h3>{item.activity}</h3><p><strong>{item.state}</strong> · {item.action}</p></article>)}</div></section>
      <section className="preview-section" aria-labelledby="preview-admin-title"><span className="eyebrow">ADMIN VIEW</span><h2 id="preview-admin-title">Review queue</h2><div className="preview-queue">{previewAdminQueue.map((item) => <article className="panel" key={item.reference}><span className="sample-tag">{item.reference}</span><h3>{item.subject}</h3><p>{item.state}</p></article>)}</div></section></div>
    <p className="preview-disclaimer">Preview data never enters the live catalogue or booking API. Use the normal site for real data; a request is not a confirmed booking.</p>
  </div>;
}
