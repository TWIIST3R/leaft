import { createBrowserClient } from "@supabase/ssr";
import { clientEnv } from "@/env";

export const supabaseBrowser = () =>
  createBrowserClient(clientEnv.NEXT_PUBLIC_SUPABASE_URL, clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);

