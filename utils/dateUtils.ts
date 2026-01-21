/**
 * Date utility functions for working with timestamps
 * All dates are derived from created_at timestamps stored in UTC
 * Use utils/timezone.ts for timezone-specific conversions
 */

/**
 * Format a timestamp for display
 * This is a convenience wrapper around timezone formatting
 */
export function formatTimestamp(timestamp: string, timezone: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get a formatted date string for display from a timestamp
 * Returns date in format like "Mon, Jan 20, 2026"
 */
export function formatDateFromTimestamp(timestamp: string, timezone: string): string {
  return formatTimestamp(timestamp, timezone);
}
