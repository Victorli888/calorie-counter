import { useState } from "preact/hooks";
import { type Entry } from "../utils/supabase.ts";
import { getUserTimezone, getLocalDateString, formatTimestamp } from "../utils/timezone.ts";

interface HistoryViewProps {
  entries: Entry[];
}

interface LocalDayTotal {
  localDate: string; // Local date string (YYYY-MM-DD)
  total_calories: number;
  total_protein: number;
}

interface MonthGroup {
  month: string;
  year: number;
  days: LocalDayTotal[];
}

export default function HistoryView({ entries }: HistoryViewProps) {
  // Detect user's timezone
  const [timezone] = useState(() => getUserTimezone());
  
  // Group entries by local date (derived from created_at timestamps)
  const localDayMap = new Map<string, LocalDayTotal>();
  
  entries.forEach((entry) => {
    // Convert UTC timestamp to local date string
    const localDate = getLocalDateString(new Date(entry.created_at), timezone);
    
    if (!localDayMap.has(localDate)) {
      localDayMap.set(localDate, {
        localDate,
        total_calories: 0,
        total_protein: 0,
      });
    }
    
    const dayTotal = localDayMap.get(localDate)!;
    dayTotal.total_calories += entry.calories;
    dayTotal.total_protein += entry.protein;
  });

  // Convert to array and sort by date (newest first)
  const localDays = Array.from(localDayMap.values()).sort(
    (a, b) => b.localDate.localeCompare(a.localDate)
  );

  // Group by month
  const monthGroups: MonthGroup[] = [];
  const monthMap = new Map<string, MonthGroup>();

  localDays.forEach((day) => {
    // Parse local date to get month/year
    const [year, month] = day.localDate.split("-").map(Number);
    const monthKey = `${year}-${month - 1}`; // month is 0-indexed for Date
    
    // Create a date object for formatting (using local date)
    const date = new Date(year, month - 1, 1);
    const monthName = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    if (!monthMap.has(monthKey)) {
      const group: MonthGroup = {
        month: monthName,
        year: year,
        days: [],
      };
      monthMap.set(monthKey, group);
      monthGroups.push(group);
    }

    const group = monthMap.get(monthKey)!;
    group.days.push(day);
  });

  if (localDays.length === 0) {
    return (
      <div class="bg-white rounded-lg shadow-md p-8 text-center">
        <p class="text-gray-500 text-lg">No history yet. Start tracking your calories!</p>
      </div>
    );
  }

  return (
    <div class="space-y-8">
      {monthGroups.map((group) => (
        <div key={`${group.year}-${group.month}`} class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-2xl font-bold mb-4 text-gray-800 border-b-2 border-blue-500 pb-2">
            {group.month}
          </h3>
          <div class="space-y-2">
            {group.days.map((day) => {
              // Format the local date for display
              const [year, month, dayNum] = day.localDate.split("-").map(Number);
              const date = new Date(year, month - 1, dayNum);
              const formattedDate = date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              
              return (
                <div
                  key={day.localDate}
                  class="flex justify-between items-center py-2 px-3 rounded hover:bg-gray-50 transition-colors"
                >
                  <span class="font-medium text-gray-700">{formattedDate}</span>
                  <div class="flex gap-6 text-gray-600">
                    <span>{day.total_calories.toLocaleString()} cal</span>
                    <span>{day.total_protein.toLocaleString()}g protein</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
