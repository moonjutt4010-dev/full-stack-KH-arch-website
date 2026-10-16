import Header from "@/components/Header";
import Notifications from "@/components/Notifications";
import LeadManager from "@/components/LeadManager";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import type { Lead, Notification } from "@/lib/validation";
export const dynamic="force-dynamic";
export const metadata={title:"Studio dashboard",robots:{index:false,follow:false}};
export default async function AdminPage(){
 const {supabase,user}=await requireUser(true);
 const [leadResult,notificationResult,auditResult]=await Promise.all([
  supabase.from("leads").select("id,name,email,phone,service,location,budget,message,status,created_at,customer_id").order("created_at",{ascending:false}).limit(500),
  supabase.from("notifications").select("id,message,read_at,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(30),
  supabase.from("audit_logs").select("id,action,entity_id,created_at,metadata").order("created_at",{ascending:false}).limit(20),
 ]);
 if(leadResult.error || notificationResult.error || auditResult.error) throw new Error("Could not load the studio workspace.");
 const leads=leadResult.data as Lead[];
 return <><Header/><main className="crm"><div className="crm-top"><div><div className="eyebrow">FORMA / STUDIO WORKSPACE</div><h1>A clearer overview.</h1></div><nav className="crm-nav"><Link href="/portal">Customer view ↗</Link><form action={signOut}><button className="text-link">Sign out</button></form></nav></div><p className="body-copy">Manage conversations, move projects forward, and keep every detail in view.</p><div className="stats">{[["Loaded requests",leads.length],["New inquiries",leads.filter(l=>l.status==="new").length],["In conversation",leads.filter(l=>["contacted","qualified","proposal"].includes(l.status)).length],["Projects won",leads.filter(l=>l.status==="won").length]].map(([title,value])=><div className="stat" key={title}><span>{title}</span><strong>{value}</strong></div>)}</div><LeadManager leads={leads}/><p className="image-note">Showing up to 500 most recent requests. Metrics reflect the loaded workspace.</p><Notifications items={notificationResult.data as Notification[]}/><section className="panel"><h2>Recent audit activity</h2>{!auditResult.data.length ? <p className="empty">No lead changes recorded yet.</p> : <div className="table-scroll"><table><thead><tr><th>EVENT</th><th>RECORD</th><th>DATE (UTC)</th></tr></thead><tbody>{auditResult.data.map(a=><tr key={a.id}><td>{a.action}</td><td className="font-mono">{a.entity_id}</td><td>{new Date(a.created_at).toLocaleString("en-GB",{timeZone:"UTC"})}</td></tr>)}</tbody></table></div>}</section></main></>;
}
