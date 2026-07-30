import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const MESES_CORTOS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const LIMA_TZ = "America/Lima";

// Reads date parts in a fixed timezone (America/Lima) and assembles the string
// ourselves — Intl.DateTimeFormat's rendered punctuation for es-PE differs
// between Node's and the browser's ICU data, which causes hydration mismatches
// if we let it produce the final string. Pinning the timezone also keeps output
// identical regardless of the server process's local TZ.
function limaParts(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: LIMA_TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  return {
    day: Number(get("day")),
    month: Number(get("month")) - 1,
    year: Number(get("year")),
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
  };
}

export function formatDate(date: string | Date) {
  const { day, month, year } = limaParts(date);
  return `${String(day).padStart(2, "0")} ${MESES_CORTOS[month]} ${year}`;
}

export function formatDateTime(date: string | Date) {
  const { day, month, hour, minute } = limaParts(date);
  const period = hour >= 12 ? "p. m." : "a. m.";
  const hour12 = hour % 12 || 12;
  return `${String(day).padStart(2, "0")} ${MESES_CORTOS[month]}, ${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

export function formatCurrency(amount: number, currency: "PEN" | "USD" = "PEN") {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
