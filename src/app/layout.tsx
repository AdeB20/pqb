import type { Metadata } from "next";
import { Inter } from "next/font/google";
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

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans text-gray-700 antialiased [scrollbar-width:thin]">
        {children}
      </body>
    </html>
  );
}
