import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing-main">
      <section className="container page-block hero-section">
        <article className="card hero-copy">
          <span className="pill">AI-Powered CV Intelligence</span>
          <h1>Improve your CV with AI</h1>
          <p>
            A modern CV Analyzer for developers and tech professionals. Upload your resume or connect GitHub, get
            ATS-style scoring, focused feedback, and rewrite suggestions you can apply immediately.
          </p>
          <div className="hero-cta">
            <Link className="button" href="/dashboard">
              Upload CV
            </Link>
            <Link className="button secondary" href="/dashboard">
              Connect GitHub
            </Link>
          </div>
        </article>

        <aside className="card hero-metrics">
          <article className="metric-card">
            <h4>Average CV clarity boost</h4>
            <p>+42%</p>
          </article>
          <article className="metric-card">
            <h4>Focused ATS checks</h4>
            <p>Keyword + impact</p>
          </article>
          <article className="metric-card">
            <h4>Built for developers</h4>
            <p>Resume + GitHub</p>
          </article>
        </aside>
      </section>

      <section className="container page-block">
        <div className="section-head">
          <h2>Feature Stack</h2>
          <p>Everything you need to move from rough CV to high-signal profile.</p>
        </div>
        <div className="grid two">
          <article className="card feature-card">
            <span className="feature-icon">01</span>
            <h3>ATS Analysis</h3>
            <p className="muted">
              AI reviews your CV against job descriptions and returns ATS-style match score and structural feedback.
            </p>
          </article>
          <article className="card feature-card">
            <span className="feature-icon">02</span>
            <h3>Rewrite Suggestions</h3>
            <p className="muted">
              Get cleaner summaries, stronger bullets, and missing terminology recommendations for target roles.
            </p>
          </article>
          <article className="card feature-card">
            <span className="feature-icon">03</span>
            <h3>Score + Priority Fixes</h3>
            <p className="muted">
              Understand what to fix first with actionable next steps, strengths, and weakness breakdown.
            </p>
          </article>
        </div>
      </section>

      <section className="container page-block">
        <div className="section-head">
          <h2>How it Works</h2>
          <p>Three steps from input to polished output.</p>
        </div>
        <div className="grid two">
          <article className="card step-card">
            <span className="step-index">1</span>
            <h3>Upload CV or GitHub</h3>
            <p className="muted">Use your resume file or paste any GitHub profile/repository link.</p>
          </article>
          <article className="card step-card">
            <span className="step-index">2</span>
            <h3>Run AI analysis</h3>
            <p className="muted">Async processing returns score, feedback cards, missing keywords, and recommendations.</p>
          </article>
          <article className="card step-card">
            <span className="step-index">3</span>
            <h3>Refine and export</h3>
            <p className="muted">Save versions, edit in builder, and export a professional PDF.</p>
          </article>
        </div>
      </section>

      <section className="container page-block">
        <div className="section-head">
          <h2>Pricing</h2>
          <p>Start free, upgrade when volume and speed matter.</p>
        </div>
        <div className="grid two pricing-grid">
          <article className="card plan-card">
            <span className="pill">Starter</span>
            <h3>Free</h3>
            <p className="price">$0</p>
            <p className="muted">Great for early iterations and occasional CV upgrades.</p>
            <Link href="/dashboard" className="button secondary">
              Start Free
            </Link>
          </article>
          <article className="card plan-card plan-highlight">
            <span className="pill">Growth</span>
            <h3>Pro</h3>
            <p className="price">$29</p>
            <p className="muted">Higher limits, queue priority, and premium export roadmap.</p>
            <Link href="/pricing" className="button">
              View Plan
            </Link>
          </article>
        </div>
      </section>

      <section className="container page-block">
        <div className="section-head">
          <h2>Testimonials</h2>
          <p>Early user feedback from tech profiles and job seekers.</p>
        </div>
        <div className="grid two testimonials-grid">
          <article className="card testimonial-card">
            <p>"It showed what my CV was missing for backend roles. The rewritten bullets were usable immediately."</p>
            <div className="testimonial-author">Backend Engineer Candidate</div>
          </article>
          <article className="card testimonial-card">
            <p>"GitHub analysis helped convert my project activity into clear resume impact statements."</p>
            <div className="testimonial-author">Full-Stack Developer</div>
          </article>
          <article className="card testimonial-card">
            <p>"Saved versions made it easy to test different CV styles for different job applications."</p>
            <div className="testimonial-author">Software Engineer</div>
          </article>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container site-footer-inner">
          <strong>CV Analyzer</strong>
          <div className="footer-links">
            <Link href="/pricing">Pricing</Link>
            <Link href="/dashboard">Dashboard</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
