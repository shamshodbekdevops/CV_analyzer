import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container hero">
      <section className="card">
        <h1>CV Analyzer for Faster Hiring Outcomes</h1>
        <p className="muted">
          Upload your CV, get ATS score and actionable rewrite suggestions, then save and share when ready.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <Link className="button" href="/dashboard">
            Open Dashboard
          </Link>
          <Link className="button ghost" href="/pricing">
            View Pricing
          </Link>
        </div>
      </section>
    </main>
  );
}
