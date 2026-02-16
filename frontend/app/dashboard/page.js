"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, clearAccessToken, getAccessToken, getApiBase, setAccessToken } from "@/lib/api";

function AuthPanel({ onAuth }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function register() {
    setError("");
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      await login();
    } catch (e) {
      setError(e.message);
    }
  }

  async function login() {
    setError("");
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      setAccessToken(data.access);
      onAuth(data.access);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
      <h2>Login or Register</h2>
      <div className="grid">
        <div>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label>Email (for register)</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="button" onClick={login}>Login</button>
          <button className="button secondary" onClick={register}>Register</button>
        </div>
      </div>
    </section>
  );
}

function AnalyzeTab({ token }) {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [saveTitle, setSaveTitle] = useState("My Resume");

  useEffect(() => {
    if (!jobId) return;
    const timer = setInterval(async () => {
      try {
        const data = await apiFetch(`/api/analyze/${jobId}`, { method: "GET" }, token);
        setStatus(data.status);
        if (data.result) {
          setResult(data.result);
        }
      } catch (e) {
        setError(e.message);
        clearInterval(timer);
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [jobId, token]);

  async function runAnalyze() {
    if (!file) {
      setError("Choose a file first.");
      return;
    }
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jobDescription);

    try {
      const data = await apiFetch("/api/analyze", { method: "POST", body: formData }, token);
      setJobId(data.job_id);
      setStatus("pending");
    } catch (e) {
      setError(e.message);
    }
  }

  async function saveResult() {
    if (!result) {
      setError("No analysis result to save.");
      return;
    }

    try {
      await apiFetch(
        "/api/resumes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: saveTitle,
            content: { summary: result.rewritten_summary || "" },
            latest_analysis: result,
          }),
        },
        token,
      );
      setError("");
      alert("Saved to your resumes.");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section className="card grid">
      <h3>Analyze CV</h3>
      <div>
        <label>CV file (PDF/DOCX/TXT)</label>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </div>
      <div>
        <label>Job Description (optional)</label>
        <textarea rows={6} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
      </div>
      <button className="button" onClick={runAnalyze}>Start Analyze</button>
      {jobId ? <p className="muted">Job ID: {jobId} | Status: {status}</p> : null}
      {result ? (
        <>
          <pre>{JSON.stringify(result, null, 2)}</pre>
          <div className="grid two">
            <div>
              <label>Title for save</label>
              <input value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} />
            </div>
            <div style={{ alignSelf: "end" }}>
              <button className="button secondary" onClick={saveResult}>Save Result</button>
            </div>
          </div>
        </>
      ) : null}
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
    </section>
  );
}

function BuilderTab({ token }) {
  const [title, setTitle] = useState("Manual Resume");
  const [summary, setSummary] = useState("");
  const [experience, setExperience] = useState("");
  const [error, setError] = useState("");

  async function saveBuilder() {
    setError("");
    try {
      await apiFetch(
        "/api/resumes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            content: { summary, experience },
            latest_analysis: {},
          }),
        },
        token,
      );
      alert("Builder CV saved.");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section className="card grid">
      <h3>CV Builder</h3>
      <div>
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label>Professional Summary</label>
        <textarea rows={5} value={summary} onChange={(e) => setSummary(e.target.value)} />
      </div>
      <div>
        <label>Experience Bullets</label>
        <textarea rows={8} value={experience} onChange={(e) => setExperience(e.target.value)} />
      </div>
      <button className="button" onClick={saveBuilder}>Save CV</button>
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
    </section>
  );
}

function SavedTab({ token }) {
  const [resumes, setResumes] = useState([]);
  const [error, setError] = useState("");

  async function loadResumes() {
    setError("");
    try {
      const data = await apiFetch("/api/resumes", { method: "GET" }, token);
      setResumes(data);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    loadResumes();
  }, []);

  async function shareResume(id) {
    try {
      const data = await apiFetch(`/api/resumes/${id}/share`, { method: "POST" }, token);
      const full = `${window.location.origin}${data.url}`;
      alert(`Share link: ${full}`);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section className="card grid">
      <h3>Saved CVs</h3>
      <button className="button ghost" onClick={loadResumes}>Refresh</button>
      <div className="grid">
        {resumes.map((resume) => (
          <article key={resume.id} className="card">
            <h4>{resume.title}</h4>
            <p className="muted">Updated: {new Date(resume.updated_at).toLocaleString()}</p>
            <button className="button secondary" onClick={() => shareResume(resume.id)}>Create Share Link</button>
          </article>
        ))}
      </div>
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
    </section>
  );
}

export default function DashboardPage() {
  const [token, setToken] = useState("");
  const [tab, setTab] = useState("analyze");

  useEffect(() => {
    setToken(getAccessToken());
  }, []);

  function logout() {
    clearAccessToken();
    setToken("");
  }

  const tabs = useMemo(
    () => [
      { id: "analyze", label: "Analyze" },
      { id: "builder", label: "Builder" },
      { id: "saved", label: "Saved CVs" },
    ],
    [],
  );

  if (!token) {
    return (
      <main className="container">
        <AuthPanel onAuth={setToken} />
      </main>
    );
  }

  return (
    <main className="container grid">
      <section className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="tabs">
          {tabs.map((item) => (
            <button
              key={item.id}
              className={`button ${tab === item.id ? "" : "ghost"}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button className="button ghost" onClick={logout}>Logout</button>
      </section>

      {tab === "analyze" ? <AnalyzeTab token={token} /> : null}
      {tab === "builder" ? <BuilderTab token={token} /> : null}
      {tab === "saved" ? <SavedTab token={token} /> : null}

      <p className="muted">API base: {getApiBase()}</p>
    </main>
  );
}
