"use client";

import { useEffect, useMemo, useState } from "react";

import { apiDownload, apiFetch, clearAccessToken, getAccessToken, setAccessToken } from "@/lib/api";

function ListSection({ title, items }) {
  if (!items || !items.length) {
    return null;
  }
  return (
    <article className="list-block">
      <h4>{title}</h4>
      <ul>
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

const ANALYZE_STATE_KEY = "cv_analyzer_analyze_state";
const BUILDER_STATE_KEY = "cv_analyzer_builder_state";

function loadClientState(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function saveClientState(key, value) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function AuthPanel({ onAuth }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function register() {
    setError("");
    setInfo("");
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      setInfo("Registration completed. Logging in...");
      await login();
    } catch (e) {
      setError(e.message);
    }
  }

  async function login() {
    setError("");
    setInfo("");
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
    <main className="page-block">
      <section className="container card panel" style={{ maxWidth: 620 }}>
        <span className="pill">Secure Access</span>
        <h2 style={{ marginTop: 12 }}>Login or Register</h2>
        <p className="muted">Use your account to run analysis jobs, save CV versions, and export PDF.</p>

        <div className="form-grid">
          <div className="form-row">
            <div>
              <label>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <label>Email (for register)</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="stack">
            <button className="button" onClick={login}>
              Login
            </button>
            <button className="button secondary" onClick={register}>
              Register
            </button>
          </div>
          {error ? <p className="inline-alert error">{error}</p> : null}
          {info ? <p className="inline-alert ok">{info}</p> : null}
        </div>
      </section>
    </main>
  );
}

function AnalyzeTab({ token }) {
  const [sourceType, setSourceType] = useState("cv");
  const [file, setFile] = useState(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [saveTitle, setSaveTitle] = useState("AI Optimized Resume");
  const [saveDone, setSaveDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const state = loadClientState(ANALYZE_STATE_KEY, {});
    setSourceType(state.sourceType || "cv");
    setGithubUrl(state.githubUrl || "");
    setJobDescription(state.jobDescription || "");
    setJobId(state.jobId || "");
    setStatus(state.status || "");
    setResult(state.result || null);
    setSaveTitle(state.saveTitle || "AI Optimized Resume");
    setSaveDone(Boolean(state.saveDone));
  }, []);

  useEffect(() => {
    saveClientState(ANALYZE_STATE_KEY, {
      sourceType,
      githubUrl,
      jobDescription,
      jobId,
      status,
      result,
      saveTitle,
      saveDone,
    });
  }, [sourceType, githubUrl, jobDescription, jobId, status, result, saveTitle, saveDone]);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    const timer = setInterval(async () => {
      try {
        const data = await apiFetch(`/api/analyze/${jobId}`, { method: "GET" }, token);
        setStatus(data.status);
        if (data.result) {
          setResult(data.result);
        }
        if (data.status === "completed" || data.status === "failed") {
          clearInterval(timer);
        }
      } catch (e) {
        setError(e.message);
        clearInterval(timer);
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [jobId, token]);

  async function runAnalyze() {
    setError("");
    setInfo("");
    setSaveDone(false);
    setResult(null);
    setJobId("");
    setStatus("pending");

    if (sourceType === "cv" && !file) {
      setError("Please upload a CV file.");
      return;
    }
    if (sourceType === "github" && !githubUrl.trim()) {
      setError("Please provide a GitHub URL.");
      return;
    }

    const formData = new FormData();
    formData.append("source_type", sourceType);
    formData.append("job_description", jobDescription);

    if (sourceType === "cv") {
      formData.append("file", file);
    } else {
      formData.append("github_url", githubUrl.trim());
    }

    try {
      const data = await apiFetch("/api/analyze", { method: "POST", body: formData }, token);
      setJobId(data.job_id);
      setInfo("Analysis job started. Please wait a few seconds.");
    } catch (e) {
      setError(e.message);
      setStatus("");
    }
  }

  async function saveResult() {
    if (!result) {
      setError("No analysis result available to save.");
      return;
    }

    try {
      setSaving(true);
      await apiFetch(
        "/api/resumes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: saveTitle,
            content: {
              summary: result.rewritten_summary || result.overall_summary || "",
              experience: Array.isArray(result.improved_bullets) ? result.improved_bullets.join("\n") : "",
              skills: result.feature_highlights || [],
            },
            latest_analysis: result,
          }),
        },
        token,
      );
      setSaveDone(true);
      setInfo("Analysis result was saved into your resume library.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const atsScore = result?.ats_score ?? 0;

  return (
    <section className="card panel form-grid">
      <h3>AI Analyze</h3>
      <p className="muted">Pick source type: upload a CV file or provide a GitHub profile/repository URL.</p>

      <div className="form-row">
        <div>
          <label>Source Type</label>
          <select value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
            <option value="cv">CV File</option>
            <option value="github">GitHub URL</option>
          </select>
        </div>
        {sourceType === "cv" ? (
          <div>
            <label>CV File (PDF/DOCX/TXT)</label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
        ) : (
          <div>
            <label>GitHub URL</label>
            <input
              placeholder="https://github.com/username or https://github.com/user/repo"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </div>
        )}
      </div>

      <div>
        <label>Target Job Description (optional)</label>
        <textarea
          rows={6}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste target job description to improve keyword matching."
        />
      </div>

      <div className="stack">
        <button className="button" onClick={runAnalyze}>
          Start Analysis
        </button>
        {jobId ? <span className={`status-badge ${status || "pending"}`}>{status || "pending"}</span> : null}
      </div>
      {error ? <p className="inline-alert error">{error}</p> : null}
      {info ? <p className="inline-alert ok">{info}</p> : null}

      {result ? (
        <div className="grid">
          <div className="kpi-grid">
            <article className="kpi-card">
              <h4>ATS Score</h4>
              <p>{atsScore}/100</p>
            </article>
            <article className="kpi-card">
              <h4>Top Strengths</h4>
              <p>{(result.strengths || []).length}</p>
            </article>
            <article className="kpi-card">
              <h4>Missing Keywords</h4>
              <p>{(result.missing_keywords || []).length}</p>
            </article>
          </div>

          <article className="list-block">
            <h4>Overall Summary</h4>
            <p className="muted" style={{ marginBottom: 0 }}>
              {result.overall_summary || "No summary provided."}
            </p>
          </article>
          <article className="list-block">
            <h4>Rewritten Professional Summary</h4>
            <p className="muted" style={{ marginBottom: 0 }}>
              {result.rewritten_summary || "No rewritten summary available."}
            </p>
          </article>

          <div className="grid two">
            <ListSection title="Strengths" items={result.strengths || []} />
            <ListSection title="Weaknesses" items={result.weaknesses || []} />
            <ListSection title="Missing Keywords" items={result.missing_keywords || []} />
            <ListSection title="Feature Highlights" items={result.feature_highlights || []} />
            <ListSection title="Improved Bullets" items={result.improved_bullets || []} />
            <ListSection title="Next Actions" items={result.next_actions || []} />
          </div>

          <div className="form-row">
            <div>
              <label>Save Title</label>
              <input value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} />
            </div>
            <div className="stack" style={{ alignItems: "flex-end" }}>
              <button className="button secondary" onClick={saveResult} disabled={saving}>
                {saving ? "Saving..." : saveDone ? "Saved" : "Save Analysis Result"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function BuilderTab({ token }) {
  const [title, setTitle] = useState("My Professional Resume");
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");
  const [summary, setSummary] = useState("");
  const [skillsCsv, setSkillsCsv] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [projects, setProjects] = useState("");
  const [savedResumeId, setSavedResumeId] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    const state = loadClientState(BUILDER_STATE_KEY, {});
    setTitle(state.title || "My Professional Resume");
    setFullName(state.fullName || "");
    setHeadline(state.headline || "");
    setEmail(state.email || "");
    setPhone(state.phone || "");
    setLocation(state.location || "");
    setLinkedin(state.linkedin || "");
    setGithub(state.github || "");
    setWebsite(state.website || "");
    setSummary(state.summary || "");
    setSkillsCsv(state.skillsCsv || "");
    setExperience(state.experience || "");
    setEducation(state.education || "");
    setProjects(state.projects || "");
    setSavedResumeId(state.savedResumeId || null);
  }, []);

  useEffect(() => {
    saveClientState(BUILDER_STATE_KEY, {
      title,
      fullName,
      headline,
      email,
      phone,
      location,
      linkedin,
      github,
      website,
      summary,
      skillsCsv,
      experience,
      education,
      projects,
      savedResumeId,
    });
  }, [
    title,
    fullName,
    headline,
    email,
    phone,
    location,
    linkedin,
    github,
    website,
    summary,
    skillsCsv,
    experience,
    education,
    projects,
    savedResumeId,
  ]);

  function parseLines(value) {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  async function saveBuilder() {
    setError("");
    setInfo("");
    try {
      const payload = {
        title,
        content: {
          full_name: fullName,
          headline,
          summary,
          contact: {
            email,
            phone,
            location,
            linkedin,
            github,
            website,
          },
          skills: skillsCsv
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          experience: parseLines(experience),
          education: parseLines(education),
          projects: parseLines(projects),
        },
        latest_analysis: {},
      };
      const data = await apiFetch(
        "/api/resumes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        token,
      );
      setSavedResumeId(data.id);
      setInfo("Resume saved. You can now export it as PDF.");
    } catch (e) {
      setError(e.message);
    }
  }

  async function exportPdf() {
    if (!savedResumeId) {
      setError("Save the resume first, then export PDF.");
      return;
    }
    try {
      const { blob, filename } = await apiDownload(`/api/resumes/${savedResumeId}/export`, token);
      downloadBlob(blob, filename);
      setInfo("PDF exported successfully.");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section className="card panel form-grid">
      <h3>Resume Builder</h3>
      <p className="muted">Fill only key fields, save once, and export professional PDF.</p>

      <div className="form-row">
        <div>
          <label>Resume Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label>Full Name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
      </div>

      <div>
        <label>Headline</label>
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Backend Engineer | Python | Distributed Systems"
        />
      </div>

      <div className="form-row">
        <div>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <div className="form-row">
        <div>
          <label>Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div>
          <label>LinkedIn</label>
          <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
        </div>
      </div>

      <div className="form-row">
        <div>
          <label>GitHub</label>
          <input value={github} onChange={(e) => setGithub(e.target.value)} />
        </div>
        <div>
          <label>Website</label>
          <input value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
      </div>

      <div>
        <label>Professional Summary</label>
        <textarea
          rows={5}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Write a concise, impact-based summary."
        />
      </div>

      <div>
        <label>Skills (comma separated)</label>
        <input
          value={skillsCsv}
          onChange={(e) => setSkillsCsv(e.target.value)}
          placeholder="Python, Django, PostgreSQL, Redis, Docker"
        />
      </div>

      <div>
        <label>Experience (one bullet per line)</label>
        <textarea
          rows={7}
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          placeholder="Built async analysis pipeline with Celery and Redis..."
        />
      </div>

      <div>
        <label>Education (one item per line)</label>
        <textarea rows={4} value={education} onChange={(e) => setEducation(e.target.value)} />
      </div>

      <div>
        <label>Projects (one item per line)</label>
        <textarea rows={4} value={projects} onChange={(e) => setProjects(e.target.value)} />
      </div>

      <div className="stack">
        <button className="button" onClick={saveBuilder}>
          Save Resume
        </button>
        <button className="button secondary" onClick={exportPdf}>
          Export PDF
        </button>
      </div>

      {error ? <p className="inline-alert error">{error}</p> : null}
      {info ? <p className="inline-alert ok">{info}</p> : null}
    </section>
  );
}

function SavedTab({ token }) {
  const [resumes, setResumes] = useState([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

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
      const fullUrl = `${window.location.origin}${data.url}`;
      await navigator.clipboard.writeText(fullUrl);
      setInfo(`Share link copied: ${fullUrl}`);
    } catch (e) {
      setError(e.message);
    }
  }

  async function exportPdf(id) {
    try {
      const { blob, filename } = await apiDownload(`/api/resumes/${id}/export`, token);
      downloadBlob(blob, filename);
      setInfo("PDF downloaded.");
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteResume(id) {
    const shouldDelete = window.confirm("Delete this resume?");
    if (!shouldDelete) {
      return;
    }
    try {
      await apiFetch(`/api/resumes/${id}`, { method: "DELETE" }, token);
      setResumes((prev) => prev.filter((resume) => resume.id !== id));
      setInfo("Resume deleted.");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section className="card panel form-grid">
      <div className="dashboard-top">
        <h3 style={{ margin: 0 }}>Saved Resumes</h3>
        <button className="button ghost" onClick={loadResumes}>
          Refresh
        </button>
      </div>

      {resumes.length === 0 ? <p className="muted">No saved resumes yet.</p> : null}
      {resumes.map((resume) => (
        <article key={resume.id} className="resume-item">
          <h4 style={{ marginTop: 0 }}>{resume.title}</h4>
          <p className="muted">Updated: {new Date(resume.updated_at).toLocaleString()}</p>
          <div className="stack">
            <button className="button secondary" onClick={() => shareResume(resume.id)}>
              Copy Share Link
            </button>
            <button className="button ghost" onClick={() => exportPdf(resume.id)}>
              Export PDF
            </button>
            <button className="button ghost" onClick={() => deleteResume(resume.id)}>
              Delete
            </button>
          </div>
        </article>
      ))}

      {error ? <p className="inline-alert error">{error}</p> : null}
      {info ? <p className="inline-alert ok">{info}</p> : null}
    </section>
  );
}

export default function DashboardPage() {
  const [token, setToken] = useState("");
  const [tab, setTab] = useState("analyze");

  useEffect(() => {
    setToken(getAccessToken());
  }, []);

  const tabs = useMemo(
    () => [
      { id: "analyze", label: "Analyze" },
      { id: "builder", label: "Builder" },
      { id: "saved", label: "Saved" },
    ],
    [],
  );

  function logout() {
    clearAccessToken();
    setToken("");
  }

  if (!token) {
    return <AuthPanel onAuth={setToken} />;
  }

  return (
    <main className="container dashboard-shell">
      <section className="card panel">
        <div className="dashboard-top">
          <div>
            <span className="pill">Workspace</span>
            <h2 style={{ marginBottom: 6 }}>CV Intelligence Dashboard</h2>
          </div>
          <button className="button ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </section>

      <section className="tab-nav">
        {tabs.map((item) => (
          <button
            key={item.id}
            className={`tab-button ${tab === item.id ? "active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </section>

      <section hidden={tab !== "analyze"}>
        <AnalyzeTab token={token} />
      </section>
      <section hidden={tab !== "builder"}>
        <BuilderTab token={token} />
      </section>
      <section hidden={tab !== "saved"}>
        <SavedTab token={token} />
      </section>
    </main>
  );
}
