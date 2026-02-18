"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  apiDownload,
  apiFetch,
  clearAuthTokens,
  getAccessToken,
  getAuthUsername,
  getRefreshToken,
  setAuthUsername,
  setAuthTokens,
} from "@/lib/api";

const ANALYZE_STATE_NAMESPACE = "cv_analyzer_analyze_state";
const BUILDER_STATE_NAMESPACE = "cv_analyzer_builder_state";
const LEGACY_ANALYZE_STATE_KEY = "cv_analyzer_analyze_state";
const LEGACY_BUILDER_STATE_KEY = "cv_analyzer_builder_state";

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

function loadClientState(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
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

function normalizeStorageScope(scope) {
  const normalized = String(scope || "default")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "_");
  return normalized || "default";
}

function scopedStateKey(namespace, scope) {
  return `${namespace}::${normalizeStorageScope(scope)}`;
}

function clearClientStateByPrefix(prefix) {
  if (typeof window === "undefined") {
    return;
  }
  const keys = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && key.startsWith(prefix)) {
      keys.push(key);
    }
  }
  keys.forEach((key) => window.localStorage.removeItem(key));
}

function getStringList(value) {
  return Array.isArray(value) ? value.filter(Boolean).map((item) => String(item)) : [];
}

function ListBlock({ title, items }) {
  if (!items?.length) {
    return null;
  }
  return (
    <article className="feedback-card">
      <h4>{title}</h4>
      <ul>
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function DistributionChart({ rows }) {
  const maxValue = Math.max(...rows.map((row) => row.value), 1);
  return (
    <article className="chart-card">
      <h4>Feedback Distribution</h4>
      <div className="chart-rows">
        {rows.map((row) => (
          <div key={row.label} className="chart-row">
            <div className="chart-row-head">
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
            <div className="chart-track">
              <div
                className="chart-fill"
                style={{
                  width: `${Math.max(8, Math.round((row.value / maxValue) * 100))}%`,
                  background: row.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function CoverageChart({ coverage, strengths, missing }) {
  return (
    <article className="chart-card">
      <h4>Keyword Coverage</h4>
      <div className="coverage-value">{coverage}%</div>
      <div className="coverage-track">
        <div className="coverage-fill" style={{ width: `${Math.max(0, Math.min(100, coverage))}%` }} />
      </div>
      <p className="muted" style={{ margin: "8px 0 0" }}>
        Matched signals: {strengths} | Missing signals: {missing}
      </p>
    </article>
  );
}

function metricTone(value, inverse = false) {
  const level = Number(value) || 0;
  if (!inverse) {
    if (level >= 75) {
      return "good";
    }
    if (level >= 45) {
      return "mid";
    }
    return "bad";
  }
  if (level >= 75) {
    return "bad";
  }
  if (level >= 45) {
    return "mid";
  }
  return "good";
}

function MetricGauge({ label, value, hint, inverse = false }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  const tone = metricTone(safe, inverse);
  return (
    <article className={`metric-gauge-card ${tone}`}>
      <div className="metric-gauge-head">
        <h4>{label}</h4>
        <strong>{safe}%</strong>
      </div>
      <div className="metric-gauge-track">
        <div className="metric-gauge-fill" style={{ width: `${safe}%` }} />
      </div>
      <p className="muted">{hint}</p>
    </article>
  );
}

function ScorePanel({ result }) {
  const score = Number(result?.ats_score || 0);
  const strengths = getStringList(result?.strengths);
  const missingKeywords = getStringList(result?.missing_keywords);
  const weaknesses = getStringList(result?.weaknesses);
  const features = getStringList(result?.feature_highlights);
  const improvedBullets = getStringList(result?.improved_bullets);
  const nextActions = getStringList(result?.next_actions);
  const totalKeywordSignals = strengths.length + missingKeywords.length;
  const keywordCoverage = totalKeywordSignals > 0 ? Math.round((strengths.length / totalKeywordSignals) * 100) : 0;
  const strengthWeight = strengths.length + features.length;
  const riskWeight = missingKeywords.length + weaknesses.length;
  const profileBalance = Math.round((strengthWeight / Math.max(1, strengthWeight + riskWeight)) * 100);
  const executionReadiness = Math.round((score * 0.6) + (keywordCoverage * 0.4));
  const improvementUrgency = Math.round((riskWeight / Math.max(1, strengthWeight + riskWeight)) * 100);
  const rewriteMomentum = Math.min(100, (improvedBullets.length * 18) + (nextActions.length * 10));
  const distributionRows = [
    { label: "Strengths", value: strengths.length, color: "var(--ok)" },
    { label: "Missing Keywords", value: missingKeywords.length, color: "var(--warn)" },
    { label: "Weaknesses", value: weaknesses.length, color: "var(--danger)" },
    { label: "Next Actions", value: nextActions.length || improvedBullets.length, color: "var(--primary)" },
  ];

  return (
    <section className="card panel form-grid">
      <h3>CV Score Overview</h3>
      <div className="score-panel">
        <div className="score-ring" style={{ "--score": Math.max(0, Math.min(100, score)) }}>
          <span className="score-value">{score}</span>
        </div>
        <div className="kpi-grid">
          <article className="kpi-card">
            <h4>ATS Score</h4>
            <p>{score}/100</p>
          </article>
          <article className="kpi-card">
            <h4>Top Strengths</h4>
            <p>{strengths.length}</p>
          </article>
          <article className="kpi-card">
            <h4>Missing Keywords</h4>
            <p>{missingKeywords.length}</p>
          </article>
          <article className="kpi-card">
            <h4>Weak Areas</h4>
            <p>{weaknesses.length}</p>
          </article>
        </div>
      </div>
      <div className="chart-grid">
        <DistributionChart rows={distributionRows} />
        <CoverageChart coverage={keywordCoverage} strengths={strengths.length} missing={missingKeywords.length} />
      </div>
      <div className="visual-metrics-grid">
        <MetricGauge label="Execution Readiness" value={executionReadiness} hint="Overall ATS + keyword alignment signal." />
        <MetricGauge label="Profile Balance" value={profileBalance} hint="How much strengths outweigh current gaps." />
        <MetricGauge label="Rewrite Momentum" value={rewriteMomentum} hint="How actionable the rewritten content is." />
        <MetricGauge
          label="Improvement Urgency"
          value={improvementUrgency}
          hint="Higher value means faster update needed."
          inverse
        />
      </div>
      <div className="feedback-grid">
        <ListBlock title="Top Strengths" items={strengths} />
        <ListBlock title="Missing Keywords" items={missingKeywords} />
        <ListBlock title="Weaknesses" items={weaknesses} />
        <ListBlock title="Feature Highlights" items={features} />
      </div>
    </section>
  );
}

function EyeIcon({ off = false }) {
  if (off) {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.8 10.8 0 0112 5c5 0 9.3 3.1 11 7-1 2.4-2.9 4.4-5.3 5.6M6.6 6.6C4.7 8 3.2 9.8 2 12c.6 1.4 1.5 2.7 2.6 3.8"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 12c1.7-3.9 6-7 10-7s8.3 3.1 10 7c-1.7 3.9-6 7-10 7S3.7 15.9 2 12zm10 3a3 3 0 100-6 3 3 0 000 6z"
      />
    </svg>
  );
}

function AuthPanel({ onAuth }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function register() {
    setLoading(true);
    setError("");
    setInfo("");
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      setInfo("Registration completed. Logging in...");
      await login(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function login(fromRegister = false) {
    if (!fromRegister) {
      setLoading(true);
    }
    setError("");
    setInfo("");
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, identifier: username, password }),
      });
      setAuthTokens(data.access, data.refresh);
      onAuth(data.access, data.refresh, data.username || username);
    } catch (e) {
      setError(e.message);
    } finally {
      if (!fromRegister) {
        setLoading(false);
      }
    }
  }

  return (
    <main className="auth-shell">
      <section className="container card auth-card form-grid">
        <span className="pill">Secure Workspace</span>
        <h2 style={{ margin: 0 }}>Login or Register</h2>
        <p className="muted">Access analysis jobs, resume builder, saved versions, and PDF export.</p>

        <div className="form-row">
          <div>
            <label>Username or Email</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="shamshodbekdevops or you@example.com" />
          </div>
          <div>
            <label>Email (register only)</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
        </div>
        <div>
          <label>Password</label>
          <div className="password-input-wrap">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon off={showPassword} />
            </button>
          </div>
        </div>
        <div className="stack">
          <button className="button" onClick={() => login(false)} disabled={loading || !username || !password}>
            {loading ? "Signing in..." : "Login"}
          </button>
          <button
            className="button secondary"
            onClick={register}
            disabled={loading || !username || !email || !password}
          >
            Register
          </button>
        </div>
        {error ? <p className="inline-alert error">{error}</p> : null}
        {info ? <p className="inline-alert ok">{info}</p> : null}
      </section>
    </main>
  );
}

function AnalyzeTab({ token, storageScope }) {
  const [sourceType, setSourceType] = useState("cv");
  const [file, setFile] = useState(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveTitle, setSaveTitle] = useState("AI Optimized Resume");
  const [isSaving, setIsSaving] = useState(false);
  const [saveDone, setSaveDone] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const fileInputRef = useRef(null);
  const analyzeStateKey = useMemo(
    () => scopedStateKey(ANALYZE_STATE_NAMESPACE, storageScope),
    [storageScope],
  );

  useEffect(() => {
    const saved = loadClientState(analyzeStateKey, {});
    setSourceType(saved.sourceType || "cv");
    setGithubUrl(saved.githubUrl || "");
    setJobDescription(saved.jobDescription || "");
    setJobId(saved.jobId || "");
    setStatus(saved.status || "");
    setResult(saved.result || null);
    setSaveTitle(saved.saveTitle || "AI Optimized Resume");
    setSaveDone(Boolean(saved.saveDone));
  }, [analyzeStateKey]);

  useEffect(() => {
    saveClientState(analyzeStateKey, {
      sourceType,
      githubUrl,
      jobDescription,
      jobId,
      status,
      result,
      saveTitle,
      saveDone,
    });
  }, [analyzeStateKey, sourceType, githubUrl, jobDescription, jobId, status, result, saveTitle, saveDone]);

  useEffect(() => {
    if (!jobId) {
      return;
    }
    const poll = setInterval(async () => {
      try {
        const data = await apiFetch(`/api/analyze/${jobId}`, { method: "GET" }, token);
        setStatus(data.status);
        if (data.result) {
          setResult(data.result);
        }
        if (data.status === "completed" || data.status === "failed") {
          clearInterval(poll);
          if (data.error_message) {
            setError(data.error_message);
          }
        }
      } catch (e) {
        setError(e.message);
        clearInterval(poll);
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [jobId, token]);

  async function runAnalyze() {
    setError("");
    setInfo("");
    setResult(null);
    setSaveDone(false);
    setIsSubmitting(true);

    if (sourceType === "cv" && !file) {
      setError("Please upload a CV file.");
      setIsSubmitting(false);
      return;
    }
    if (sourceType === "github" && !githubUrl.trim()) {
      setError("Please enter a GitHub profile or repo URL.");
      setIsSubmitting(false);
      return;
    }

    const form = new FormData();
    form.append("source_type", sourceType);
    if (jobDescription.trim()) {
      form.append("job_description", jobDescription.trim());
    }
    if (sourceType === "cv" && file) {
      form.append("file", file);
    }
    if (sourceType === "github") {
      form.append("github_url", githubUrl.trim());
    }

    try {
      const created = await apiFetch("/api/analyze", { method: "POST", body: form }, token);
      setJobId(created.job_id);
      setStatus("pending");
      setInfo("Analysis started. Results will appear automatically.");
    } catch (e) {
      setError(e.message);
      setStatus("");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveResult() {
    if (!result) {
      setError("No analysis result to save.");
      return;
    }
    setError("");
    setInfo("");
    setIsSaving(true);
    try {
      await apiFetch(
        "/api/resumes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: saveTitle || "AI Optimized Resume",
            content: {
              summary: result.rewritten_summary || result.overall_summary || "",
              experience: getStringList(result.improved_bullets),
              skills: getStringList(result.feature_highlights),
            },
            latest_analysis: result,
          }),
        },
        token,
      );
      setSaveDone(true);
      setInfo("Analysis saved to your library.");
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  }

  function onDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setError("");
    }
  }

  return (
    <section className="dashboard-content">
      <section className="card panel form-grid">
        <div className="panel-head">
          <div>
            <h2>Analyze Resume or GitHub</h2>
            <p className="muted" style={{ margin: 0 }}>
              Run AI analysis with ATS score, strengths, missing keywords, and rewrite suggestions.
            </p>
          </div>
          {jobId ? <span className={`status-badge ${status || "pending"}`}>{status || "pending"}</span> : null}
        </div>

        <div className="form-row">
          <div>
            <label>Input Type</label>
            <select
              value={sourceType}
              onChange={(event) => {
                setSourceType(event.target.value);
                setError("");
              }}
            >
              <option value="cv">CV File</option>
              <option value="github">GitHub Link</option>
            </select>
          </div>
          {sourceType === "github" ? (
            <div>
              <label>GitHub URL</label>
              <input
                value={githubUrl}
                onChange={(event) => setGithubUrl(event.target.value)}
                placeholder="https://github.com/username or https://github.com/user/repo"
              />
            </div>
          ) : (
            <div>
              <label>CV Upload</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                style={{ display: "none" }}
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
              <div
                className={`dropzone ${isDragging ? "drag-active" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
              >
                <p>{file ? `Selected: ${file.name}` : "Drag & drop your CV here, or click to browse."}</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <label>Target Job Description (optional)</label>
          <textarea
            rows={5}
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste job description for better keyword matching and ATS feedback."
          />
        </div>

        <div className="stack">
          <button className="button" onClick={runAnalyze} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Run AI Analysis"}
          </button>
          <button
            className="button secondary"
            onClick={() => {
              setJobId("");
              setStatus("");
              setResult(null);
              setError("");
              setInfo("");
              setFile(null);
              setSaveDone(false);
            }}
          >
            Reset
          </button>
        </div>

        {status === "pending" || status === "processing" ? (
          <div className="loading-row">
            <span className="loader-dot" />
            <span>AI worker is processing your request...</span>
          </div>
        ) : null}

        {error ? <p className="inline-alert error">{error}</p> : null}
        {info ? <p className="inline-alert ok">{info}</p> : null}
      </section>

      {result ? (
        <>
          <ScorePanel result={result} />

          <section className="card panel form-grid">
            <h3>Improvement Suggestions</h3>
            <div className="feedback-grid">
              <article className="feedback-card">
                <h4>Overall Summary</h4>
                <p className="muted">{result.overall_summary || "No summary generated."}</p>
              </article>
              <article className="feedback-card">
                <h4>Rewritten Summary</h4>
                <p className="muted">{result.rewritten_summary || "No rewrite generated."}</p>
              </article>
              <ListBlock title="Improved Bullets" items={getStringList(result.improved_bullets)} />
              <ListBlock title="Next Actions" items={getStringList(result.next_actions)} />
            </div>
            <div className="form-row">
              <div>
                <label>Save As</label>
                <input value={saveTitle} onChange={(event) => setSaveTitle(event.target.value)} />
              </div>
              <div className="stack" style={{ alignItems: "flex-end" }}>
                <button className="button secondary" onClick={saveResult} disabled={isSaving}>
                  {isSaving ? "Saving..." : saveDone ? "Saved" : "Save to Library"}
                </button>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}

function BuilderTab({ token, storageScope }) {
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const builderStateKey = useMemo(
    () => scopedStateKey(BUILDER_STATE_NAMESPACE, storageScope),
    [storageScope],
  );

  useEffect(() => {
    const saved = loadClientState(builderStateKey, {});
    setTitle(saved.title || "My Professional Resume");
    setFullName(saved.fullName || "");
    setHeadline(saved.headline || "");
    setEmail(saved.email || "");
    setPhone(saved.phone || "");
    setLocation(saved.location || "");
    setLinkedin(saved.linkedin || "");
    setGithub(saved.github || "");
    setWebsite(saved.website || "");
    setSummary(saved.summary || "");
    setSkillsCsv(saved.skillsCsv || "");
    setExperience(saved.experience || "");
    setEducation(saved.education || "");
    setProjects(saved.projects || "");
    setSavedResumeId(saved.savedResumeId || null);
  }, [builderStateKey]);

  useEffect(() => {
    saveClientState(builderStateKey, {
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
    builderStateKey,
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

  function splitLines(value) {
    return String(value)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  async function saveResume() {
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const payload = {
        title,
        content: {
          full_name: fullName,
          headline,
          summary,
          contact: { email, phone, location, linkedin, github, website },
          skills: skillsCsv
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          experience: splitLines(experience),
          education: splitLines(education),
          projects: splitLines(projects),
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
      setInfo("Resume saved successfully.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function exportPdf() {
    if (!savedResumeId) {
      setError("Save resume first, then export PDF.");
      return;
    }
    setError("");
    setInfo("");
    try {
      const { blob, filename } = await apiDownload(`/api/resumes/${savedResumeId}/export`, token);
      downloadBlob(blob, filename);
      setInfo("PDF exported.");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section className="dashboard-content">
      <section className="card panel form-grid">
        <div className="panel-head">
          <div>
            <h2>Resume Builder</h2>
            <p className="muted" style={{ margin: 0 }}>
              Fill key information and export a polished PDF CV.
            </p>
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Resume Title</label>
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div>
            <label>Full Name</label>
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </div>
        </div>

        <div>
          <label>Headline</label>
          <input value={headline} onChange={(event) => setHeadline(event.target.value)} />
        </div>

        <div className="form-row">
          <div>
            <label>Email</label>
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div>
            <label>Phone</label>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Location</label>
            <input value={location} onChange={(event) => setLocation(event.target.value)} />
          </div>
          <div>
            <label>LinkedIn</label>
            <input value={linkedin} onChange={(event) => setLinkedin(event.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>GitHub</label>
            <input value={github} onChange={(event) => setGithub(event.target.value)} />
          </div>
          <div>
            <label>Website</label>
            <input value={website} onChange={(event) => setWebsite(event.target.value)} />
          </div>
        </div>

        <div>
          <label>Professional Summary</label>
          <textarea rows={4} value={summary} onChange={(event) => setSummary(event.target.value)} />
        </div>

        <div>
          <label>Skills (comma separated)</label>
          <input value={skillsCsv} onChange={(event) => setSkillsCsv(event.target.value)} />
        </div>

        <div>
          <label>Experience (one line per bullet)</label>
          <textarea rows={6} value={experience} onChange={(event) => setExperience(event.target.value)} />
        </div>

        <div>
          <label>Education (one line per item)</label>
          <textarea rows={4} value={education} onChange={(event) => setEducation(event.target.value)} />
        </div>

        <div>
          <label>Projects (one line per item)</label>
          <textarea rows={4} value={projects} onChange={(event) => setProjects(event.target.value)} />
        </div>

        <div className="stack">
          <button className="button" onClick={saveResume} disabled={saving}>
            {saving ? "Saving..." : "Save Resume"}
          </button>
          <button className="button secondary" onClick={exportPdf}>
            Export PDF
          </button>
        </div>

        {error ? <p className="inline-alert error">{error}</p> : null}
        {info ? <p className="inline-alert ok">{info}</p> : null}
      </section>
    </section>
  );
}

function SavedTab({ token }) {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function loadResumes() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/resumes", { method: "GET" }, token);
      setResumes(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResumes();
  }, []);

  async function copyShareLink(id) {
    setError("");
    setInfo("");
    try {
      const data = await apiFetch(`/api/resumes/${id}/share`, { method: "POST" }, token);
      const fullUrl = `${window.location.origin}${data.url}`;
      await navigator.clipboard.writeText(fullUrl);
      setInfo("Share link copied.");
    } catch (e) {
      setError(e.message);
    }
  }

  async function exportResume(id) {
    setError("");
    setInfo("");
    try {
      const { blob, filename } = await apiDownload(`/api/resumes/${id}/export`, token);
      downloadBlob(blob, filename);
      setInfo("PDF downloaded.");
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteResume(id) {
    const confirmed = window.confirm("Delete this resume?");
    if (!confirmed) {
      return;
    }
    setError("");
    setInfo("");
    try {
      await apiFetch(`/api/resumes/${id}`, { method: "DELETE" }, token);
      setResumes((prev) => prev.filter((resume) => resume.id !== id));
      setInfo("Resume deleted.");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section className="dashboard-content">
      <section className="card panel form-grid">
        <div className="panel-head">
          <div>
            <h2>Saved CV Library</h2>
            <p className="muted" style={{ margin: 0 }}>
              Manage versions, export PDFs, and share view-only links.
            </p>
          </div>
          <button className="button ghost" onClick={loadResumes}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading-row">
            <span className="loader-dot" />
            <span>Loading resumes...</span>
          </div>
        ) : null}

        {!loading && resumes.length === 0 ? <p className="muted">No saved resumes yet.</p> : null}

        {resumes.map((resume) => {
          const skills = Array.isArray(resume.content?.skills) ? resume.content.skills : [];
          const summary = resume.content?.summary || "";
          const versions = Array.isArray(resume.versions) ? resume.versions.length : 0;
          return (
            <article key={resume.id} className="resume-item">
              <div className="panel-head">
                <div>
                  <h3 style={{ margin: 0 }}>{resume.title}</h3>
                  <p className="muted" style={{ margin: "6px 0 0" }}>
                    Updated: {new Date(resume.updated_at).toLocaleString()} | Versions: {versions}
                  </p>
                </div>
                <div className="stack">
                  <button className="button secondary" onClick={() => copyShareLink(resume.id)}>
                    Share
                  </button>
                  <button className="button ghost" onClick={() => exportResume(resume.id)}>
                    Export
                  </button>
                  <button className="button ghost" onClick={() => deleteResume(resume.id)}>
                    Delete
                  </button>
                </div>
              </div>

              {summary ? (
                <p className="muted" style={{ marginTop: 8 }}>
                  {summary}
                </p>
              ) : null}
              {skills.length ? (
                <div className="tag-list">
                  {skills.map((skill, index) => (
                    <span className="tag" key={`${resume.id}-skill-${index}`}>
                      {skill}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}

        {error ? <p className="inline-alert error">{error}</p> : null}
        {info ? <p className="inline-alert ok">{info}</p> : null}
      </section>
    </section>
  );
}

export default function DashboardPage() {
  const [token, setToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [me, setMe] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [tab, setTab] = useState("analyze");

  const tabs = useMemo(
    () => [
      { id: "analyze", label: "Analyze" },
      { id: "builder", label: "Builder" },
      { id: "saved", label: "Saved CVs" },
    ],
    [],
  );
  const storageScope = useMemo(
    () => normalizeStorageScope(me?.username || displayName || "anonymous"),
    [me?.username, displayName],
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LEGACY_ANALYZE_STATE_KEY);
      window.localStorage.removeItem(LEGACY_BUILDER_STATE_KEY);
    }
    const access = getAccessToken();
    const refresh = getRefreshToken();
    const username = getAuthUsername();
    if (access) {
      setToken(access);
      setRefreshToken(refresh);
      setDisplayName(username);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }
    async function loadMe() {
      try {
        const data = await apiFetch("/api/auth/me", { method: "GET" }, token);
        setMe(data);
        setDisplayName(data?.username || "");
        setAuthUsername(data?.username || "");
      } catch {
        setMe(null);
      }
    }
    loadMe();
  }, [token]);

  function handleAuth(access, refresh, username = "") {
    setToken(access);
    setRefreshToken(refresh || "");
    setDisplayName(username || "");
    setAuthUsername(username || "");
  }

  function logout() {
    clearAuthTokens();
    if (typeof window !== "undefined") {
      clearClientStateByPrefix(`${ANALYZE_STATE_NAMESPACE}::`);
      clearClientStateByPrefix(`${BUILDER_STATE_NAMESPACE}::`);
      window.localStorage.removeItem(LEGACY_ANALYZE_STATE_KEY);
      window.localStorage.removeItem(LEGACY_BUILDER_STATE_KEY);
    }
    setToken("");
    setRefreshToken("");
    setMe(null);
    setDisplayName("");
    setTab("analyze");
  }

  if (!token) {
    return <AuthPanel onAuth={handleAuth} />;
  }

  return (
    <main className="dashboard-app">
      <div className="container dashboard-user-top">
        <span className="pill dashboard-user-pill-sm">Signed in as @{me?.username || displayName || "user"}</span>
        <button type="button" className="button ghost dashboard-user-logout-sm" onClick={logout}>
          Logout
        </button>
      </div>
      <div className="container dashboard-layout">
        <aside className="card dashboard-sidebar">
          <div>
            <p className="pill">{me?.username ? `@${me.username}` : "Workspace"}</p>
            <h2 className="sidebar-title" style={{ marginTop: 10 }}>
              CV Intelligence
            </h2>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              Premium AI tools for resume and GitHub profile optimization.
            </p>
          </div>

          <nav className="sidebar-nav">
            {tabs.map((item) => (
              <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>
                {item.label}
              </button>
            ))}
          </nav>

          <button className="button ghost" onClick={logout}>
            Logout
          </button>
          {refreshToken ? (
            <p className="muted" style={{ margin: 0, fontSize: "0.76rem" }}>
              Session token: active
            </p>
          ) : null}
        </aside>

        <section hidden={tab !== "analyze"}>
          <AnalyzeTab token={token} storageScope={storageScope} />
        </section>
        <section hidden={tab !== "builder"}>
          <BuilderTab token={token} storageScope={storageScope} />
        </section>
        <section hidden={tab !== "saved"}>
          <SavedTab token={token} />
        </section>
      </div>
    </main>
  );
}
