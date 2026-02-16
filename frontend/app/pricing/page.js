export default function PricingPage() {
  return (
    <main className="container grid two">
      <article className="card">
        <h2>Free</h2>
        <p>$0 / month</p>
        <p className="muted">Analyze-only mode, limited monthly checks, manual save.</p>
      </article>
      <article className="card">
        <h2>Pro</h2>
        <p>$29 / month</p>
        <p className="muted">Higher limits, faster queue, advanced exports and team options.</p>
      </article>
    </main>
  );
}
