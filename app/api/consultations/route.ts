import { createHmac } from "node:crypto";
import { consultationSchema } from "@/lib/validation";
import { createIntakeClient, createSupabase, isConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const origin = process.env.APP_ORIGIN;
  if (!origin || request.headers.get("origin") !== new URL(origin).origin) return Response.json({ error: "Request origin is not allowed." }, { status: 403 });
  if (!isConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.RATE_LIMIT_SECRET) return Response.json({ error: "Consultation requests are temporarily unavailable. Please try again later." }, { status: 503 });
  if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({ error: "Expected JSON." }, { status: 415 });
  let raw: string;
  try {
    const reader = request.body?.getReader();
    if (!reader) return Response.json({ error: "Missing request." }, { status: 400 });
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) { await reader.cancel(); return Response.json({ error: "Request is too large." }, { status: 413 }); }
      chunks.push(value);
    }
    raw = Buffer.concat(chunks).toString("utf8");
  } catch { return Response.json({ error: "Could not read request." }, { status: 400 }); }
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  const parsed = consultationSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  try {
    const supabase = await createSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    // The deployment proxy must overwrite x-forwarded-for; see README.
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const hash = (value: string) => createHmac("sha256", process.env.RATE_LIMIT_SECRET!).update(value).digest("hex");
    const { website: _trap, consent: _consent, ...lead } = parsed.data;
    const { error } = await createIntakeClient().rpc("submit_consultation", { p_lead: lead, p_customer_id: user?.id ?? null, p_ip_hash: hash(ip), p_email_hash: hash(lead.email) });
    if (error?.message.includes("rate_limit")) return Response.json({ error: "Too many requests. Please try again in an hour." }, { status: 429 });
    if (error) return Response.json({ error: "We could not save your request. Please try again later." }, { status: 503 });
    return Response.json({ message: "Thank you. Your consultation request has been received. The studio will be in touch." }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Requests are temporarily unavailable. Please try again later." }, { status: 503 }); }
}
