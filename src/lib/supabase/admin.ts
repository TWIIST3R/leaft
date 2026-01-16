import { createClient } from "@supabase/supabase-js";
import { clientEnv } from "@/env";
import { serverEnv } from "@/env";

/**
 * Create a Supabase admin client with service role key
 * This bypasses RLS and should only be used for server-side operations
 * that require elevated privileges (e.g., middleware subscription checks)
 */
export function supabaseAdmin() {
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  return createClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
