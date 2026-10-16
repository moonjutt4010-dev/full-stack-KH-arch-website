"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { createSupabase, isConfigured } from "@/lib/supabase/server";
export type AuthState = { error: string };
export async function signIn(_state: AuthState, form: FormData): Promise<AuthState> {
  if (!isConfigured()) return { error: "The client portal is being configured. Please try again later." };
  const parsed = z.object({email:z.email().max(254),password:z.string().min(1).max(128)}).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Please enter a valid email and password." };
  const supabase = await createSupabase();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Unable to sign in. Check your credentials and try again." };
  redirect("/portal");
}
export async function signOut() {
  const supabase = await createSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Could not sign out. Please try again.");
  redirect("/login");
}
