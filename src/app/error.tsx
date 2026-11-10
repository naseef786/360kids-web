"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <h1>We couldn’t load this page</h1>
      <p className="record-meta">
        Please try again. If the problem continues, return to discovery and sign
        in again.
      </p>
      <div className="card-actions">
        <button className="btn" onClick={reset}>
          Try again
        </button>
        <Link className="btn outline" href="/">
          Back to discovery
        </Link>
      </div>
    </main>
  );
}
