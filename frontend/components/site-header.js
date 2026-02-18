"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { clearAuthTokens, getAuthUsername } from "@/lib/api";

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
  const [authUser, setAuthUser] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const currentTheme = getInitialTheme();
    setTheme(currentTheme);
    document.documentElement.setAttribute("data-theme", currentTheme);
    setAuthUser(getAuthUsername());

    function syncUser() {
      setAuthUser(getAuthUsername());
    }
    window.addEventListener("storage", syncUser);
    window.addEventListener("focus", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("focus", syncUser);
    };
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem(THEME_KEY, next);
  }

  function logout() {
    clearAuthTokens();
    setAuthUser("");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <header className="site-header-wrap">
      <div className="container site-header">
        <Link href="/" className="brand-link">
          <strong>CV Analyzer</strong>
          <span>AI Resume Studio</span>
        </Link>
        <nav className="site-nav">
          <Link href="/pricing" className={`nav-link ${pathname === "/pricing" ? "active" : ""}`}>
            Pricing
          </Link>
          <Link href="/dashboard" className={`nav-link ${pathname === "/dashboard" ? "active" : ""}`}>
            Dashboard
          </Link>
        </nav>
        <div className="header-actions">
          {authUser ? <span className="pill header-user-pill">@{authUser}</span> : null}
          {authUser ? (
            <button type="button" className="button ghost header-logout-btn" onClick={logout}>
              Logout
            </button>
          ) : null}
          <button type="button" className="theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </div>
    </header>
  );
}
