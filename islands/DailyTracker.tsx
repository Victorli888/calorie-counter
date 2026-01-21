import { useState, useEffect } from "preact/hooks";
import { type Entry, getSupabaseClient } from "../utils/supabase.ts";
import { getUserTimezone, getTodayLocalDateString, getLocalDayUtcRange, getLocalDateString } from "../utils/timezone.ts";

interface DailyTrackerProps {
  initialEntries: Entry[];
}

export default function DailyTracker({ initialEntries }: DailyTrackerProps) {
  // Detect user's timezone
  const [timezone] = useState(() => getUserTimezone());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    entry_name: "",
    calories: "",
    protein: "",
  });
  const [editData, setEditData] = useState({
    entry_name: "",
    calories: "",
    protein: "",
  });

  // Get today's date in user's timezone
  const todayLocal = getTodayLocalDateString(timezone);

  // Initialize with filtered entries from server
  useEffect(() => {
    console.log("Initializing DailyTracker - timezone:", timezone, "todayLocal:", todayLocal);
    console.log("Initial entries count:", initialEntries.length);
    
    // Filter entries to only show today's entries based on created_at
    const filtered = initialEntries.filter(entry => {
      const localDate = getLocalDateString(new Date(entry.created_at), timezone);
      const matches = localDate === todayLocal;
      if (!matches) {
        console.log(`Entry ${entry.id} filtered out - localDate: ${localDate}, todayLocal: ${todayLocal}`);
      }
      return matches;
    });
    
    console.log("Filtered entries count:", filtered.length);
    setEntries(filtered);
  }, [initialEntries, timezone, todayLocal]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    fetchEntries();
    
    // Check for date change every minute (using local timezone)
    const interval = setInterval(() => {
      const currentLocalDate = getTodayLocalDateString(timezone);
      if (currentLocalDate !== todayLocal) {
        // Date changed - reload page to show new day
        window.location.reload();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [timezone, todayLocal]);

  async function fetchEntries() {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = getSupabaseClient();
      // Get UTC timestamp range for "today" in user's timezone
      const [startUTC, endUTC] = getLocalDayUtcRange(timezone, todayLocal);
      
      console.log("Fetching entries for local date:", todayLocal, "timezone:", timezone);
      console.log("UTC range:", startUTC.toISOString(), "to", endUTC.toISOString());
      
      // Query using UTC timestamp range
      // endUTC is exclusive (start of next day), so use .lt() to exclude entries from next day
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .gte("created_at", startUTC.toISOString())
        .lt("created_at", endUTC.toISOString())
        .order("created_at", { ascending: false });
      
      console.log("Raw query returned", data?.length || 0, "entries");
      if (data && data.length > 0) {
        console.log("Sample entry created_at:", data[0].created_at);
        const sampleLocalDate = getLocalDateString(new Date(data[0].created_at), timezone);
        console.log("Sample entry local date:", sampleLocalDate);
      }

      if (error) {
        console.error("Error fetching entries:", error);
        setError(`Failed to load entries: ${error.message}`);
        return;
      }

      // Filter to ensure all entries match today's local date (handles edge cases)
      const filtered = (data || []).filter(entry => {
        const localDate = getLocalDateString(new Date(entry.created_at), timezone);
        return localDate === todayLocal;
      });

      console.log("Fetched entries:", filtered.length);
      setEntries(filtered);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("Error in fetchEntries:", err);
      setError(`Failed to connect to database: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  }

  async function addEntry(e: Event) {
    e.preventDefault();
    
    if (!formData.entry_name || !formData.calories || !formData.protein) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      const supabase = getSupabaseClient();
      // Set entry_date to today's local date (deprecated but required by DB schema)
      // TODO: Update database schema to make entry_date nullable or remove it
      const todayLocalDate = getTodayLocalDateString(timezone);
      const entryData = {
        entry_name: formData.entry_name,
        calories: parseInt(formData.calories),
        protein: parseInt(formData.protein),
        entry_date: todayLocalDate, // Deprecated but required until schema is updated
        // created_at will be set automatically by database (TIMESTAMPTZ DEFAULT now())
      };
      
      console.log("Adding entry:", entryData);
      
      const { data, error } = await supabase
        .from("entries")
        .insert(entryData)
        .select();

      if (error) {
        console.error("Error adding entry:", error);
        setError(`Failed to add entry: ${error.message}`);
        return;
      }

      console.log("Entry added successfully:", data);
      setSuccessMessage(`Successfully added ${formData.entry_name}!`);
      setFormData({ entry_name: "", calories: "", protein: "" });
      await fetchEntries();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("Error in addEntry:", err);
      setError(`Failed to add entry: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  }

  async function updateEntry(id: string) {
    if (!editData.entry_name || !editData.calories || !editData.protein) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      const supabase = getSupabaseClient();
      const updateData = {
        entry_name: editData.entry_name,
        calories: parseInt(editData.calories),
        protein: parseInt(editData.protein),
        // Don't update created_at - it's immutable
      };
      
      console.log("Updating entry:", id, updateData);
      
      const { error } = await supabase
        .from("entries")
        .update(updateData)
        .eq("id", id);

      if (error) {
        console.error("Error updating entry:", error);
        setError(`Failed to update entry: ${error.message}`);
        return;
      }

      console.log("Entry updated successfully");
      setSuccessMessage(`Successfully updated ${editData.entry_name}!`);
      setEditingId(null);
      await fetchEntries();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("Error in updateEntry:", err);
      setError(`Failed to update entry: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  }

  async function deleteEntry(id: string) {
    if (!confirm("Are you sure you want to delete this entry?")) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      const supabase = getSupabaseClient();
      console.log("Deleting entry:", id);
      
      const { error } = await supabase
        .from("entries")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting entry:", error);
        setError(`Failed to delete entry: ${error.message}`);
        return;
      }

      console.log("Entry deleted successfully");
      setSuccessMessage("Entry deleted successfully!");
      await fetchEntries();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("Error in deleteEntry:", err);
      setError(`Failed to delete entry: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(entry: Entry) {
    setEditingId(entry.id);
    setEditData({
      entry_name: entry.entry_name,
      calories: entry.calories.toString(),
      protein: entry.protein.toString(),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditData({ entry_name: "", calories: "", protein: "" });
  }

  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);
  const totalProtein = entries.reduce((sum, e) => sum + e.protein, 0);

  return (
    <div class="space-y-6">
      {/* Error Message */}
      {error && (
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong class="font-bold">Error: </strong>
          <span class="block sm:inline">{error}</span>
          <button
            onClick={() => setError(null)}
            class="absolute top-0 right-0 px-4 py-3"
          >
            <span class="text-red-700 text-xl">&times;</span>
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <strong class="font-bold">Success: </strong>
          <span class="block sm:inline">{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            class="absolute top-0 right-0 px-4 py-3"
          >
            <span class="text-green-700 text-xl">&times;</span>
          </button>
        </div>
      )}

      {/* Add Entry Form */}
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-xl font-semibold mb-4 text-gray-800">Add Entry</h3>
        <form onSubmit={addEntry} class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Food Name
              </label>
              <input
                type="text"
                value={formData.entry_name}
                onInput={(e) =>
                  setFormData({ ...formData, entry_name: e.currentTarget.value })}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Chicken Breast"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Calories
              </label>
              <input
                type="number"
                value={formData.calories}
                onInput={(e) =>
                  setFormData({ ...formData, calories: e.currentTarget.value })}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Protein (g)
              </label>
              <input
                type="number"
                value={formData.protein}
                onInput={(e) =>
                  setFormData({ ...formData, protein: e.currentTarget.value })}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            class="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Adding..." : "Add Entry"}
          </button>
        </form>
      </div>

      {/* Totals Display */}
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
        <div class="flex justify-between items-center">
          <div>
            <p class="text-blue-100 text-sm">Total Calories</p>
            <p class="text-3xl font-bold">{totalCalories.toLocaleString()}</p>
          </div>
          <div>
            <p class="text-blue-100 text-sm">Total Protein</p>
            <p class="text-3xl font-bold">{totalProtein.toLocaleString()}g</p>
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-xl font-semibold mb-4 text-gray-800">Today's Entries</h3>
        {loading && entries.length === 0 ? (
          <p class="text-gray-500 text-center py-8">Loading entries...</p>
        ) : entries.length === 0 ? (
          <p class="text-gray-500 text-center py-8">No entries yet. Add your first entry above!</p>
        ) : (
          <div class="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                {editingId === entry.id ? (
                  <div class="space-y-3">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={editData.entry_name}
                        onInput={(e) =>
                          setEditData({ ...editData, entry_name: e.currentTarget.value })}
                        class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        value={editData.calories}
                        onInput={(e) =>
                          setEditData({ ...editData, calories: e.currentTarget.value })}
                        class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                      <input
                        type="number"
                        value={editData.protein}
                        onInput={(e) =>
                          setEditData({ ...editData, protein: e.currentTarget.value })}
                        class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                    <div class="flex gap-2">
                      <button
                        onClick={() => updateEntry(entry.id)}
                        disabled={loading}
                        class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={loading}
                        class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div class="flex justify-between items-center">
                    <div class="flex-1">
                      <p class="font-semibold text-gray-800">{entry.entry_name}</p>
                      <div class="flex gap-4 mt-1 text-sm text-gray-600">
                        <span>{entry.calories} cal</span>
                        <span>{entry.protein}g protein</span>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <button
                        onClick={() => startEdit(entry)}
                        disabled={loading}
                        class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        disabled={loading}
                        class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
