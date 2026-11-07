import Link from "next/link";
export default function Missing() {
  return (
    <main className="content">
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
