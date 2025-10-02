import { DAYS_PER_WEEK } from "./constants.js";

export function today() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export function addDays(date, days) {
  const clone = new Date(date.getTime());
  clone.setDate(clone.getDate() + days);
  return clone;
}

export function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}

export function formatShort(date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

export function startOfWeek(date) {
  const clone = new Date(date.getTime());
  const day = clone.getDay();
  clone.setDate(clone.getDate() - ((day + 6) % DAYS_PER_WEEK));
  return clone;
}

export function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function daysBetween(start, end) {
  const diff = end.getTime() - start.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}
