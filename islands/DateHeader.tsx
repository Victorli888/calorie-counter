import { useState, useEffect } from "preact/hooks";
import { getUserTimezone, getTodayLocalDateString, formatDateString } from "../utils/timezone.ts";

export default function DateHeader() {
  const [timezone, setTimezone] = useState("UTC");
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    // Detect user's timezone on client-side
    const detectedTimezone = getUserTimezone();
    setTimezone(detectedTimezone);
    
    // Get today's date string in the user's timezone
    const todayLocal = getTodayLocalDateString(detectedTimezone);
    
    // Format it for display
    const formatted = formatDateString(todayLocal, detectedTimezone);
    setFormattedDate(formatted);
  }, []);

  // Show loading state briefly while timezone is detected
  if (!formattedDate) {
    return <h2 class="text-3xl font-bold mb-6 text-gray-800">Loading...</h2>;
  }

  return <h2 class="text-3xl font-bold mb-6 text-gray-800">{formattedDate}</h2>;
}
