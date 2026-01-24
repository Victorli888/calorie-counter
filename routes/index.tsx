import { type Handlers, type PageProps } from "$fresh/server.ts";
import DailyTracker from "../islands/DailyTracker.tsx";
import DateHeader from "../islands/DateHeader.tsx";
import { getSupabaseClient, type Entry } from "../utils/supabase.ts";

export const handler: Handlers<Entry[]> = {
  async GET(_req, ctx) {
    try {
      const supabase = getSupabaseClient();
      // Fetch all entries - client will filter by UTC timestamp range based on user's timezone
      console.log("Fetching entries for today page...");
      
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching entries:", error);
        return ctx.render([]);
      }

      console.log(`Fetched ${data?.length || 0} entries`);
      return ctx.render(data || []);
    } catch (err) {
      console.error("Error in index handler:", err);
      return ctx.render([]);
    }
  },
};

export default function Home({ data }: PageProps<Entry[]>) {
  return (
    <div>
      <DateHeader />
      <DailyTracker initialEntries={data} />
    </div>
  );
}
