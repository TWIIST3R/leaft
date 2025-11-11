function readEnv(name: string, required: boolean): string | undefined {
  const value = process.env[name];
  if (required && (!value || value.length === 0)) {
    throw new Error(`[env] Missing required environment variable: ${name}`);
  }
  return value;
}

const requireEnv = (name: string) => {
  const value = readEnv(name, true);
  return value ?? "";
};

export const serverEnv = {
  SUPABASE_SERVICE_ROLE_KEY: readEnv("SUPABASE_SERVICE_ROLE_KEY", false),
  CLERK_SECRET_KEY: requireEnv("CLERK_SECRET_KEY"),
  STRIPE_SECRET_KEY: requireEnv("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: requireEnv("STRIPE_WEBHOOK_SECRET"),
};

export const clientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: requireEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
  NEXT_PUBLIC_APP_URL: requireEnv("NEXT_PUBLIC_APP_URL"),
};

export const optionalEnv = {
  CLERK_WEBHOOK_SECRET: readEnv("CLERK_WEBHOOK_SECRET", false),
  HASDATA_API_KEY: readEnv("HASDATA_API_KEY", false),
};

export type ServerEnv = typeof serverEnv;
export type ClientEnv = typeof clientEnv;

