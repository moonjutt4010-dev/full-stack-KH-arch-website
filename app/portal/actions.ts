"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
export async function markNotificationRead(form: FormData) {
  const { supabase, user } = await requireUser();
  const id = z.uuid().parse(form.get("id"));
  const { error } = await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("id",id).eq("user_id",user.id);
  if (error) throw new Error("Could not update notification. Please try again.");
  revalidatePath("/portal"); revalidatePath("/admin");
}
