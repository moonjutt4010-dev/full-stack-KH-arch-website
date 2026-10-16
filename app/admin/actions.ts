"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { statusSchema } from "@/lib/validation";
export type MutationState = { message: string; error: boolean };
export async function updateLeadStatus(_state: MutationState, form: FormData): Promise<MutationState> {
  const { supabase } = await requireUser(true);
  const parsed = statusSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { message: "Invalid status update.", error: true };
  const { id, status, previousStatus } = parsed.data;
  const { data, error } = await supabase.from("leads").update({status}).eq("id",id).eq("status",previousStatus).select("id");
  if (error) return { message: "Could not update this lead. Please try again.", error: true };
  if (!data?.length) return { message: "This lead has changed. Refresh before trying again.", error: true };
  revalidatePath("/admin"); revalidatePath("/portal");
  return { message: "Lead status updated.", error: false };
}
export async function assignCustomer(_state: MutationState, form: FormData): Promise<MutationState> {
  const { supabase } = await requireUser(true);
  const parsed = z.object({id:z.uuid(),customerId:z.uuid()}).safeParse(Object.fromEntries(form));
  if (!parsed.success) return {message:"Enter a valid customer account UUID.",error:true};
  const {error} = await supabase.rpc("assign_lead_customer",{p_lead_id:parsed.data.id,p_customer_id:parsed.data.customerId});
  if (error) return {message:"Could not link this request. Verify the customer account and try again.",error:true};
  revalidatePath("/admin"); revalidatePath("/portal");
  return {message:"Customer account linked. They can now see this request.",error:false};
}
