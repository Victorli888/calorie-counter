interface DayTotal {
  entry_date: string;
  total_calories: number;
  total_protein: number;
}

interface HistoryViewProps {
  dayTotals: DayTotal[];
}

interface MonthGroup {
  month: string;
  year: number;
  days: DayTotal[];
}

export default function HistoryView({ dayTotals }: HistoryViewProps) {
  // Group days by month
  const monthGroups: MonthGroup[] = [];
  const monthMap = new Map<string, MonthGroup>();

  dayTotals.forEach((day) => {
    const date = new Date(day.entry_date);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const monthName = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    if (!monthMap.has(monthKey)) {
      const group: MonthGroup = {
        month: monthName,
        year: date.getFullYear(),
        days: [],
      };
      monthMap.set(monthKey, group);
      monthGroups.push(group);
    }

    const group = monthMap.get(monthKey)!;
    group.days.push(day);
  });

  if (dayTotals.length === 0) {
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
              const date = new Date(day.entry_date);
              const formattedDate = date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              return (
                <div
                  key={day.entry_date}
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
