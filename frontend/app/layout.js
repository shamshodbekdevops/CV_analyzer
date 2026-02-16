import { Manrope, Space_Grotesk } from "next/font/google";

import "./globals.css";
import SiteHeader from "@/components/site-header";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata = {
  title: "CV Analyzer SaaS",
  description: "Analyze CVs or GitHub profiles, improve content, and export professional PDF resumes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${spaceGrotesk.variable}`}>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
