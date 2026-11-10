import Link from "next/link";
export default function NotFound() {
  return (
    <main className="error-page">
      <h1>This page isn’t available</h1>
      <p className="record-meta">
        It may have moved or be unavailable to your account.
      </p>
      <Link className="btn" href="/parent/activities">
        Explore activities
      </Link>
    </main>
  );
}
