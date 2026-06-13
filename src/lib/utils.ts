import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createHash } from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function daysRemaining(lastUploadAt: string | null, obligationDays: number): number {
  if (!lastUploadAt) return 0;
  const deadline = new Date(lastUploadAt);
  deadline.setDate(deadline.getDate() + obligationDays);
  const diff = deadline.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

interface RateLimitEntry {
  count: number;
  reset: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.reset) {
    rateLimitStore.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= maxAttempts) {
    return false;
  }
  entry.count++;
  return true;
}

export function getRateLimitCount(key: string): number {
  const entry = rateLimitStore.get(key);
  if (!entry || Date.now() > entry.reset) return 0;
  return entry.count;
}

export function getActiveRateLimitKeys(): number {
  const now = Date.now();
  let count = 0;
  rateLimitStore.forEach((entry) => {
    if (now <= entry.reset) count++;
  });
  return count;
}

const CLEANUP_INTERVAL = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  let activeCount = 0;
  rateLimitStore.forEach((entry, key) => {
    if (now > entry.reset) {
      rateLimitStore.delete(key);
    } else {
      activeCount++;
    }
  });
  if (activeCount > 100) {
    console.log(
      `[UniPastQ] ${JSON.stringify({ t: new Date().toISOString(), lvl: "warn", ev: "ratelimit.high_utilization", msg: "Rate limit store has high number of active entries", count: activeCount })}`,
    );
  }
}, CLEANUP_INTERVAL);

const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function validateFile(
  mimeType: string,
  size: number,
): { valid: true } | { valid: false; error: string } {
  if (size > MAX_FILE_SIZE) {
    return { valid: false, error: "File exceeds 10MB limit" };
  }
  if (!ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number])) {
    return { valid: false, error: "Only PDF, JPG, and PNG files are allowed" };
  }
  return { valid: true };
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

const SEMESTERS = ["first", "second"] as const;
export function isValidSemester(value: string): value is "first" | "second" {
  return SEMESTERS.includes(value as typeof SEMESTERS[number]);
}
