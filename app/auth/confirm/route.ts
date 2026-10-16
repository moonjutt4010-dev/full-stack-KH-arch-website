import { NextResponse } from "next/server";
import { createSupabase, isConfigured } from "@/lib/supabase/server";
export async function GET(request:Request) {
 const url=new URL(request.url);
 const token_hash=url.searchParams.get("token_hash");
 const type=url.searchParams.get("type");
 if(isConfigured() && token_hash && (type==="invite" || type==="recovery")) {
  const supabase=await createSupabase();
  const {error}=await supabase.auth.verifyOtp({token_hash,type});
  if(!error) return NextResponse.redirect(new URL("/account",url.origin),{headers:{"Cache-Control":"no-store","Referrer-Policy":"no-referrer"}});
 }
 return NextResponse.redirect(new URL("/login?link=expired",url.origin),{headers:{"Cache-Control":"no-store","Referrer-Policy":"no-referrer"}});
}
