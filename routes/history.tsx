import { type Handlers, type PageProps } from "$fresh/server.ts";
import HistoryView from "../islands/HistoryView.tsx";
import { getSupabaseClient } from "../utils/supabase.ts";

interface DayTotal {
  entry_date: string;
  total_calories: number;
  total_protein: number;
}

export const handler: Handlers<DayTotal[]> = {
  async GET(_req, ctx) {
    try {
      const supabase = getSupabaseClient();
      console.log("Fetching history from Supabase...");
      
      const { data, error } = await supabase
        .from("entries")
        .select("entry_date, calories, protein")
        .order("entry_date", { ascending: false });

      if (error) {
        console.error("Error fetching history:", error);
        return ctx.render([]);
      }

      console.log(`Fetched ${data?.length || 0} entries for history`);

      // Group by date and calculate totals
      const grouped: Record<string, DayTotal> = {};
      (data || []).forEach((entry) => {
        const date = entry.entry_date;
        if (!grouped[date]) {
          grouped[date] = {
            entry_date: date,
            total_calories: 0,
            total_protein: 0,
          };
        }
        grouped[date].total_calories += entry.calories;
        grouped[date].total_protein += entry.protein;
      });

      const dayTotals = Object.values(grouped).sort(
        (a, b) => b.entry_date.localeCompare(a.entry_date)
      );

      console.log(`Grouped into ${dayTotals.length} days`);
      return ctx.render(dayTotals);
    } catch (err) {
      console.error("Error in history handler:", err);
      return ctx.render([]);
    }
  },
};

export default function History({ data }: PageProps<DayTotal[]>) {
  return (
    <div>
      <h2 class="text-3xl font-bold mb-6 text-gray-800">History</h2>
      <HistoryView dayTotals={data} />
    </div>
  );
}
