import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="page-block">
      <section className="container pricing-head">
        <h1>Simple Pricing For Faster Resume Wins</h1>
        <p className="muted">Start free, then move to Pro when you need higher volume and team-ready workflows.</p>
      </section>

      <section className="container grid two">
        <article className="card plan-card">
          <span className="pill">Free</span>
          <h2>Starter</h2>
          <p className="price">$0</p>
          <p className="muted">Analyze jobs with monthly limits, save resumes, create share links, and export PDF.</p>
          <Link href="/dashboard" className="button secondary">
            Start Free
          </Link>
        </article>

        <article className="card plan-card" style={{ borderColor: "var(--primary)" }}>
          <span className="pill">Pro</span>
          <h2>Growth</h2>
          <p className="price">$29</p>
          <p className="muted">
            Higher analysis limits, priority queue, advanced export templates, and future team collaboration tools.
          </p>
          <Link href="/dashboard" className="button">
            Upgrade Path
          </Link>
        </article>
      </section>
    </main>
  );
}
