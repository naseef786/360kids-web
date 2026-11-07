import Link from "next/link";

const steps = [
  { title: "Request a place", body: "Choose an activity and send your request. A request does not reserve a place." },
  { title: "Hear from the provider", body: "The provider checks availability and confirms the places they can hold for you." },
  { title: "Confirm your booking", body: "Follow the payment instructions. Your booking is confirmed after payment is verified." },
];
export default function Home() {
  return (
    <main>
      <header><Link className="brand" href="/" aria-label="360 Kids Activity home">360 <span>Kids Activity</span></Link><span className="preview">Development preview</span></header>
      <section className="hero" aria-labelledby="title">
        <p className="eyebrow">Little adventures. Big possibilities.</p>
        <h1 id="title">Find their next<br /><em>favourite thing.</em></h1>
        <p className="intro">A new way to discover activities, explore interests and plan memorable days for your family.</p>
        <a className="button" href="#how-it-works">How booking will work <span aria-hidden="true">↗</span></a>
        <p className="notice">We’re building the experience. Bookings and payments are not available in this preview.</p>
      </section>
      <section id="how-it-works" aria-labelledby="steps-title"><p className="eyebrow">Clear at every step</p><h2 id="steps-title">From discovery to a confirmed place.</h2><ol className="steps">{steps.map((step, i) => <li key={step.title}><span className="number" aria-hidden="true">0{i + 1}</span><h3>{step.title}</h3><p>{step.body}</p></li>)}</ol></section>
      <footer>360 Kids Activity · Family experiences, thoughtfully planned.</footer>
    </main>
  );
}
