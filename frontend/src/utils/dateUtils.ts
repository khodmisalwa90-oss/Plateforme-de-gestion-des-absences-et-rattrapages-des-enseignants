/**
 * Format date string (e.g. YYYY-MM-DD or ISO string) to readable French format.
 * @param dateStr Date string
 * @param includeWeekday Whether to include the weekday in the formatting
 */
export function formatDate(dateStr: string, includeWeekday = true): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("fr-FR", {
      ...(includeWeekday && { weekday: "long" }),
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Format a time string (e.g. "14:30:00" or "14:30") to "HH:MM".
 */
export function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  }
  return timeStr;
}

/**
 * Check if date1 is strictly after date2 (both as string dates or Dates).
 */
export function isAfterDate(date1: string | Date, date2: string | Date): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return d1.getTime() > d2.getTime();
}

/**
 * Check if a time string "HH:MM" (start) is strictly before another "HH:MM" (end).
 */
export function isBeforeTime(start: string, end: string): boolean {
  if (!start || !end) return false;
  const [sHour, sMin] = start.split(":").map(Number);
  const [eHour, eMin] = end.split(":").map(Number);
  if (sHour < eHour) return true;
  if (sHour === eHour) return sMin < eMin;
  return false;
}
