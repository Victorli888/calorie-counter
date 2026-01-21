import { type Handlers, type PageProps } from "$fresh/server.ts";
import HistoryView from "../islands/HistoryView.tsx";
import { getSupabaseClient, type Entry } from "../utils/supabase.ts";

export const handler: Handlers<Entry[]> = {
  async GET(_req, ctx) {
    try {
      const supabase = getSupabaseClient();
      console.log("Fetching history from Supabase...");
      
      // Fetch all entries ordered by created_at - client will group by local date
      const { data, error } = await supabase
        .from("entries")
        .select("id, entry_name, calories, protein, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching history:", error);
        return ctx.render([]);
      }

      console.log(`Fetched ${data?.length || 0} entries for history`);
      return ctx.render(data || []);
    } catch (err) {
      console.error("Error in history handler:", err);
      return ctx.render([]);
    }
  },
};

export default function History({ data }: PageProps<Entry[]>) {
  return (
    <div>
      <h2 class="text-3xl font-bold mb-6 text-gray-800">History</h2>
      <HistoryView entries={data} />
    </div>
  );
}
