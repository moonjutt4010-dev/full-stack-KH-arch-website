import Link from "next/link";
import Header from "@/components/Header";
import Notifications from "@/components/Notifications";
import { requireUser } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import type { Notification } from "@/lib/validation";
export const dynamic="force-dynamic";
export const metadata={title:"Your project",robots:{index:false,follow:false}};
export default async function PortalPage(){
 const {supabase,user,role}=await requireUser();
 const [leads,notifications]=await Promise.all([
  supabase.from("leads").select("id,service,location,status,created_at").eq("customer_id",user.id).order("created_at",{ascending:false}).limit(100),
  supabase.from("notifications").select("id,message,read_at,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(30),
 ]);
 if(leads.error || notifications.error) throw new Error("Could not load your project workspace.");
 return <><Header/><main className="crm"><div className="crm-top"><div><div className="eyebrow">YOUR PRIVATE WORKSPACE</div><h1>Your next chapter.</h1></div><nav className="crm-nav">{role==="admin"&&<Link href="/admin">Studio dashboard ↗</Link>}<Link href="/contact">New consultation →</Link><form action={signOut}><button className="text-link">Sign out</button></form></nav></div><section className="panel"><h2>Your consultations</h2>{!leads.data.length ? <div className="empty">No consultations are linked to your account yet.<br/>Submit a request while signed in, or ask the studio to link an existing inquiry.</div>:<div className="table-scroll"><table><thead><tr><th>SERVICE</th><th>LOCATION</th><th>RECEIVED</th><th>STAGE</th></tr></thead><tbody>{leads.data.map(l=><tr key={l.id}><td>{l.service}</td><td>{l.location}</td><td>{new Date(l.created_at).toLocaleDateString("en-GB",{timeZone:"UTC"})}</td><td><span className="badge">{l.status}</span></td></tr>)}</tbody></table></div>}</section><Notifications items={notifications.data as Notification[]}/></main></>;
}
