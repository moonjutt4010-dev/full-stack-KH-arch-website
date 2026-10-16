"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
export async function setPassword(_state:{error:string},form:FormData) {
 const {supabase}=await requireUser();
 const parsed=z.object({password:z.string().min(12).max(128),confirm:z.string()}).refine(v=>v.password===v.confirm).safeParse(Object.fromEntries(form));
 if(!parsed.success) return {error:"Use at least 12 characters and make sure both passwords match."};
 const {error}=await supabase.auth.updateUser({password:parsed.data.password});
 if(error) return {error:"Could not set your password. Try a different password or request a new invitation."};
 redirect("/portal");
}
