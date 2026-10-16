import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export function isConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
export async function createSupabase() {
  if (!isConfigured()) throw new Error("Supabase is not configured.");
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => { try { values.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* Server Components are read-only; proxy refreshes cookies. */ } },
    },
  });
}
// Used ONLY by the bounded public intake RPC. Never use for CRM reads or updates.
export function createIntakeClient() {
  if (!isConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Intake is not configured.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
