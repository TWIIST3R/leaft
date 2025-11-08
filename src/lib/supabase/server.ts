import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { clientEnv } from "@/env";

export const supabaseServer = async () => {
  const cookieStore = await cookies();

  return createServerClient(clientEnv.NEXT_PUBLIC_SUPABASE_URL, clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: Parameters<typeof cookieStore.set>[2]) {
        cookieStore.set(name, value, options);
      },
      remove(name: string, options?: Parameters<typeof cookieStore.set>[2]) {
        cookieStore.set(name, "", { ...options, expires: new Date(0) });
      },
    },
  });
};

