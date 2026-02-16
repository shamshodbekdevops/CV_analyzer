import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-block">
      <section className="container hero-shell">
        <article className="card hero-main">
          <span className="pill">CV + GitHub AI Analysis</span>
          <h1>Turn raw experience into a premium, interview-ready resume.</h1>
          <p>
            Upload a CV or paste any GitHub profile/repository link. The platform scrapes signal, generates ATS
            feedback, rewrites weak sections, and helps you export a polished PDF.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/dashboard">
              Open Dashboard
            </Link>
            <Link className="button secondary" href="/pricing">
              See Plans
            </Link>
          </div>
        </article>
        <aside className="card hero-side">
          <div className="hero-metric">
            <h4>Analyze sources</h4>
            <p>CV or GitHub</p>
          </div>
          <div className="hero-metric">
            <h4>Async processing</h4>
            <p>Redis + Celery</p>
          </div>
          <div className="hero-metric">
            <h4>Final output</h4>
            <p>Professional PDF</p>
          </div>
        </aside>
      </section>

      <section className="container page-block" style={{ paddingTop: 16 }}>
        <div className="grid two">
          <article className="card panel">
            <h3>1) Analyze</h3>
            <p className="muted">
              Choose source type, run AI analysis, and get strengths, missing keywords, rewritten summary, and impact
              bullets.
            </p>
          </article>
          <article className="card panel">
            <h3>2) Build</h3>
            <p className="muted">
              Fill your resume fields once. Save clean structured content with version history and reuse it anytime.
            </p>
          </article>
          <article className="card panel">
            <h3>3) Export</h3>
            <p className="muted">
              Download a neatly formatted PDF in one click and share your public resume view with a secure token link.
            </p>
          </article>
          <article className="card panel">
            <h3>4) Improve</h3>
            <p className="muted">
              Iterate fast with new job descriptions and keep only results you explicitly save, exactly like SaaS best
              practices.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
