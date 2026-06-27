import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { validateEnv } from "@/lib/env";

// Fail fast at build time if env vars are missing
if (typeof window === "undefined") {
  const missing = validateEnv();
  if (missing.length > 0) {
    throw new Error(
      `FATAL: Missing required environment variables: ${missing.join(", ")}. ` +
      "Check .env.example for the full list.",
    );
  }
}

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "University Past Questions Platform",
  description: "Browse, download, and upload past examination questions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased [scrollbar-width:thin] selection:bg-secondary selection:text-white">
        {children}
      </body>
    </html>
  );
}
