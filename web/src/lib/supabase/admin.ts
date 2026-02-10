import { createClient } from "@supabase/supabase-js";

/**
 * Admin client using the service role key — bypasses RLS.
 * Only use server-side for bootstrap / admin operations.
 * Throws if env vars are missing.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Safe variant — returns null instead of throwing when env vars are missing.
 * Use in contexts where admin access is optional (e.g. layout bootstrap).
 */
export function tryCreateAdminClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}
