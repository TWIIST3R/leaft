import { createClient } from "@supabase/supabase-js";
import { clientEnv } from "@/env";
import { serverEnv } from "@/env";

/**
 * Create a Supabase admin client with service role key
 * This bypasses RLS and should only be used for server-side operations
 * that require elevated privileges (e.g., middleware subscription checks)
 * Falls back to anon key if service role key is not available (for development)
 */
export function supabaseAdmin() {
  const serviceRoleKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY || clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!serviceRoleKey) {
    throw new Error("Neither SUPABASE_SERVICE_ROLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY is configured");
  }

  // Log a warning if using anon key instead of service role key (development only)
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY is not configured. Using anon key instead (RLS will not be bypassed).");
  }

  return createClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
