import { type Handlers, type PageProps } from "$fresh/server.ts";
import DailyTracker from "../islands/DailyTracker.tsx";
import { getSupabaseClient, type Entry } from "../utils/supabase.ts";

export const handler: Handlers<Entry[]> = {
  async GET(_req, ctx) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const supabase = getSupabaseClient();
      console.log("Fetching entries for today:", today);
      
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("entry_date", today)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching entries:", error);
        return ctx.render([]);
      }

      console.log(`Fetched ${data?.length || 0} entries for today`);
      return ctx.render(data || []);
    } catch (err) {
      console.error("Error in index handler:", err);
      return ctx.render([]);
    }
  },
};

export default function Home({ data }: PageProps<Entry[]>) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <h2 class="text-3xl font-bold mb-6 text-gray-800">{today}</h2>
      <DailyTracker initialEntries={data} />
    </div>
  );
}
