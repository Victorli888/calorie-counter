/**
 * Timezone utility functions for handling IANA timezone conversions
 * All timestamps are stored in UTC, converted to user's timezone only for display
 */

/**
 * Get user's IANA timezone from browser
 * Returns timezone string like "America/Los_Angeles" or "Europe/London"
 */
export function getUserTimezone(): string {
  if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  // Fallback to UTC if Intl API not available
  return "UTC";
}

/**
 * Get today's date string in the user's timezone (YYYY-MM-DD)
 */
export function getTodayLocalDateString(timezone: string): string {
  const now = new Date();
  return getLocalDateString(now, timezone);
}

/**
 * Get local date string (YYYY-MM-DD) for a given UTC timestamp in the specified timezone
 */
export function getLocalDateString(date: Date, timezone: string): string {
  // Use Intl.DateTimeFormat to format date in the specified timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  
  // en-CA locale gives us YYYY-MM-DD format
  return formatter.format(date);
}

/**
 * Get UTC timestamp range (start and end) for a local calendar day
 * Returns [startUTC, endUTC] as Date objects
 * 
 * Example: For "2026-01-20" in "America/Los_Angeles":
 * - startUTC: 2026-01-20 08:00:00 UTC (midnight PST)
 * - endUTC: 2026-01-21 08:00:00 UTC (midnight of next day PST, exclusive)
 */
export function getLocalDayUtcRange(
  timezone: string,
  localDateString: string
): [Date, Date] {
  // Parse the local date string (YYYY-MM-DD)
  const [year, month, day] = localDateString.split("-").map(Number);
  
  // Start of day: midnight (00:00:00.000) in the timezone
  const startUTC = getUtcForLocalTime(timezone, year, month - 1, day, 0, 0, 0);
  
  // End of day: midnight of the NEXT day (exclusive boundary)
  // Calculate next day by adding 1 day to the date components
  // Handle month/year rollover
  let nextYear = year;
  let nextMonth = month;
  let nextDay = day + 1;
  
  // Simple day rollover handling (works for most cases)
  // For more complex cases, we'd need to account for month lengths
  const daysInMonth = new Date(year, month, 0).getDate();
  if (nextDay > daysInMonth) {
    nextDay = 1;
    nextMonth += 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
  }
  
  const endUTC = getUtcForLocalTime(timezone, nextYear, nextMonth - 1, nextDay, 0, 0, 0);
  
  return [startUTC, endUTC];
}

/**
 * Get UTC Date object for a specific local time in a timezone
 * Uses iterative binary search to find the correct UTC time
 * 
 * This function finds what UTC time corresponds to a given local time in a timezone.
 * Example: For "2026-01-20 00:00:00" in "America/Los_Angeles" (PST, UTC-8),
 * it returns a Date object representing "2026-01-20 08:00:00 UTC"
 */
function getUtcForLocalTime(
  timezone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number
): Date {
  // Create a formatter for the target timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  
  // Start with an initial guess: assume UTC time equals local time
  // This will be wrong for non-UTC timezones, but we'll adjust iteratively
  let guessUTC = new Date(Date.UTC(year, month, day, hour, minute, second));
  
  // Use a reasonable range for adjustment (±24 hours should cover all timezones)
  let adjustmentRange = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  // Iterate to converge on the correct UTC time
  // Uses binary search approach for faster convergence
  for (let i = 0; i < 20; i++) {
    const parts = formatter.formatToParts(guessUTC);
    const actualYear = parseInt(parts.find(p => p.type === "year")!.value);
    const actualMonth = parseInt(parts.find(p => p.type === "month")!.value) - 1;
    const actualDay = parseInt(parts.find(p => p.type === "day")!.value);
    const actualHour = parseInt(parts.find(p => p.type === "hour")!.value);
    const actualMinute = parseInt(parts.find(p => p.type === "minute")!.value);
    const actualSecond = parseInt(parts.find(p => p.type === "second")!.value);
    
    // Check if we've found the correct time
    if (
      actualYear === year &&
      actualMonth === month &&
      actualDay === day &&
      actualHour === hour &&
      actualMinute === minute &&
      actualSecond === second
    ) {
      break;
    }
    
    // Compare target vs actual to determine adjustment direction
    // Create comparable date strings
    const targetStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
    const actualStr = `${actualYear}-${String(actualMonth + 1).padStart(2, "0")}-${String(actualDay).padStart(2, "0")}T${String(actualHour).padStart(2, "0")}:${String(actualMinute).padStart(2, "0")}:${String(actualSecond).padStart(2, "0")}`;
    
    // If actual is later than target, we need to move UTC backward
    // If actual is earlier than target, we need to move UTC forward
    const comparison = actualStr.localeCompare(targetStr);
    
    if (comparison > 0) {
      // Actual is later, move UTC backward
      guessUTC = new Date(guessUTC.getTime() - adjustmentRange);
    } else if (comparison < 0) {
      // Actual is earlier, move UTC forward
      guessUTC = new Date(guessUTC.getTime() + adjustmentRange);
    }
    
    // Reduce adjustment range for next iteration (binary search)
    adjustmentRange /= 2;
  }
  
  return guessUTC;
}

/**
 * Format a UTC timestamp for display in the user's timezone
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
