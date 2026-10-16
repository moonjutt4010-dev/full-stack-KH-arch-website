import "server-only";
import { redirect } from "next/navigation";
import { createSupabase, isConfigured } from "./supabase/server";

export async function requireUser(admin = false) {
  if (!isConfigured()) redirect("/login?setup=required");
  const supabase = await createSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profileError || !profile) throw new Error("Your account is not ready. Please contact the studio.");
  if (admin && profile.role !== "admin") redirect("/portal");
  return { supabase, user, role: profile.role as "admin" | "customer" };
}
