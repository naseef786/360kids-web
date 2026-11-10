"use client";
import Link from "next/link";
export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main id="main-content" className="content" tabIndex={-1}>
      <section className="auth-card">
        <h1>We couldn’t open this page.</h1>
        <p>
          Please try again. If the problem continues, return home and contact
          support.
        </p>
        <div className="actions">
          <button onClick={retry}>Try again</button>
          <Link href="/">Return home</Link>
        </div>
      </section>
    </main>
  );
}
