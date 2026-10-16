import type { Notification } from "@/lib/validation";
import { markNotificationRead } from "@/app/portal/actions";
export default function Notifications({items}:{items:Notification[]}) {
 return <section className="panel"><div className="section-top mb-0"><h2>Notifications</h2><span className="quiet-label">{items.filter(n=>!n.read_at).length} UNREAD</span></div>{!items.length ? <p className="empty">You’re all caught up. Project updates will appear here.</p> : items.map(n=><div className="notification" key={n.id}><div><p>{n.message}</p><small className="text-gray-500">{new Date(n.created_at).toLocaleDateString("en-GB",{timeZone:"UTC"})}</small></div>{!n.read_at && <form action={markNotificationRead}><input type="hidden" name="id" value={n.id} /><button type="submit">Mark as read</button></form>}</div>)}</section>;
}
