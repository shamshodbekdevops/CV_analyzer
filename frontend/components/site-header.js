"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const THEME_KEY = "cv_analyzer_theme";

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "light";
  }
  const saved = window.localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") {
    return saved;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function SiteHeader() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const currentTheme = getInitialTheme();
    setTheme(currentTheme);
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem(THEME_KEY, next);
  }

  return (
    <header className="site-header-wrap">
      <div className="container site-header">
        <Link href="/" className="brand-link">
          CV Analyzer
          <span>AI Resume Studio</span>
        </Link>
        <nav className="site-nav">
          <Link href="/pricing">Pricing</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
        <button type="button" className="theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
        </button>
      </div>
    </header>
  );
}
