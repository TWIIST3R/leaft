function readEnv(name: string, required: boolean) {
  const value = process.env[name];
  if (required && (!value || value.length === 0)) {
    throw new Error(`[env] Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const serverEnv = {
  SUPABASE_SERVICE_ROLE_KEY: readEnv("SUPABASE_SERVICE_ROLE_KEY", true),
  CLERK_SECRET_KEY: readEnv("CLERK_SECRET_KEY", true),
  STRIPE_SECRET_KEY: readEnv("STRIPE_SECRET_KEY", true),
  STRIPE_WEBHOOK_SECRET: readEnv("STRIPE_WEBHOOK_SECRET", true),
};

export const clientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: readEnv("NEXT_PUBLIC_SUPABASE_URL", true),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", true),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: readEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", true),
  NEXT_PUBLIC_APP_URL: readEnv("NEXT_PUBLIC_APP_URL", true),
};

export const optionalEnv = {
  CLERK_WEBHOOK_SECRET: readEnv("CLERK_WEBHOOK_SECRET", false),
  HASDATA_API_KEY: readEnv("HASDATA_API_KEY", false),
};

export type ServerEnv = typeof serverEnv;
export type ClientEnv = typeof clientEnv;

