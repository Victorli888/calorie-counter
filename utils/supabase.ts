import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Get Supabase credentials from environment variables (server-side) or window globals (client-side)
function getSupabaseUrl(): string {
  if (typeof Deno !== "undefined" && Deno.env) {
    return Deno.env.get("SUPABASE_URL") || "";
  }
  if (typeof window !== "undefined" && (window as any).SUPABASE_URL) {
    return (window as any).SUPABASE_URL;
  }
  return "";
}

function getSupabaseAnonKey(): string {
  if (typeof Deno !== "undefined" && Deno.env) {
    return Deno.env.get("SUPABASE_ANON_KEY") || "";
  }
  if (typeof window !== "undefined" && (window as any).SUPABASE_ANON_KEY) {
    return (window as any).SUPABASE_ANON_KEY;
  }
  return "";
}

// Cache the client instance
let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create a Supabase client instance.
 * Works in both server-side (Deno) and client-side (browser) contexts.
 * 
 * @throws Error if Supabase credentials are not configured
 */
export function getSupabaseClient(): SupabaseClient {
  // Return cached client if available
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = 
      "Supabase credentials not found. " +
      "Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file " +
      "or as window.SUPABASE_URL and window.SUPABASE_ANON_KEY globals.";
    
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Create and cache the client
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log("Supabase client initialized successfully");
  return supabaseClient;
}

// Export a default instance for backward compatibility (server-side only)
// This will throw an error if called client-side without window globals
export const supabase = (() => {
  try {
    return getSupabaseClient();
  } catch (error) {
    // Return a dummy client that will fail on operations
    // This prevents the module from crashing on import
    return createClient("", "");
  }
})();

export interface Entry {
  id: string;
  entry_name: string;
  calories: number;
  protein: number;
  entry_date: string;
  created_at?: string;
}
