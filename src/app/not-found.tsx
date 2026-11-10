import Link from "next/link";
export default function Missing() {
  return (
    <main id="main-content" className="content" tabIndex={-1}>
      <div className="empty">
        <span>✳</span>
        <h1>This adventure isn’t here.</h1>
        <p>The page may have moved. Let’s find something new.</p>
        <Link className="button" href="/activities">
          Explore activities
        </Link>
      </div>
    </main>
  );
}
