"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

function ValueBlock({ title, value }) {
  if (!value) {
    return null;
  }
  return (
    <article className="list-block">
      <h4>{title}</h4>
      <p className="muted" style={{ marginBottom: 0 }}>
        {value}
      </p>
    </article>
  );
}

export default function SharedResumePage({ params }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const result = await apiFetch(`/api/share/${params.token}`, { method: "GET" });
        setData(result);
      } catch (e) {
        setError(e.message);
      }
    }
    load();
  }, [params.token]);

  return (
    <main className="page-block">
      <section className="container card panel">
        <h2>Shared Resume</h2>
        {error ? <p className="inline-alert error">{error}</p> : null}
        {!data ? <p className="muted">Loading shared profile...</p> : null}

        {data ? (
          <div className="grid">
            <p className="muted" style={{ margin: 0 }}>
              Owner: <strong>{data.owner}</strong>
            </p>
            <h3 style={{ margin: 0 }}>{data.title}</h3>

            <ValueBlock title="Summary" value={data.content?.summary} />
            <ValueBlock title="Experience" value={data.content?.experience} />
            <ValueBlock title="Skills" value={Array.isArray(data.content?.skills) ? data.content.skills.join(", ") : data.content?.skills} />

            <article className="list-block">
              <h4>AI Analysis Snapshot</h4>
              <pre className="share-pre">{JSON.stringify(data.latest_analysis || {}, null, 2)}</pre>
            </article>
          </div>
        ) : null}
      </section>
    </main>
  );
}
