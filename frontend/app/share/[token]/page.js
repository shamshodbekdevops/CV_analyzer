"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

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
    <main className="container">
      <section className="card">
        <h2>Shared Resume</h2>
        {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
        {data ? (
          <div className="grid">
            <p className="muted">Owner: {data.owner}</p>
            <h3>{data.title}</h3>
            <pre>{JSON.stringify(data.content, null, 2)}</pre>
            <h4>Analysis</h4>
            <pre>{JSON.stringify(data.latest_analysis, null, 2)}</pre>
          </div>
        ) : (
          <p className="muted">Loading...</p>
        )}
      </section>
    </main>
  );
}
