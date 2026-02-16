import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "CV Analyzer SaaS",
  description: "Analyze, improve, and save resumes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar container">
          <Link href="/">CV Analyzer</Link>
          <nav style={{ display: "flex", gap: 12 }}>
            <Link href="/pricing">Pricing</Link>
            <Link href="/dashboard">Dashboard</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
