"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { services } from "@/lib/validation";
import { Arrow } from "./Icons";
export default function ConsultationForm() {
 const [pending,setPending] = useState(false);
 const [result,setResult] = useState<{message:string;error:boolean}|null>(null);
 async function submit(event:FormEvent<HTMLFormElement>) {
  event.preventDefault(); setPending(true); setResult(null);
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form));
  try {
   const response = await fetch("/api/consultations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...values,consent:values.consent === "on"})});
   const data = await response.json();
   setResult({message:data.error || data.message,error:!response.ok});
   if(response.ok) form.reset();
  } catch { setResult({message:"We could not connect. Please try again.",error:true}); }
  finally {setPending(false);}
 }
 return <form onSubmit={submit} className="form-panel"><div aria-live="polite">{result && <div className={`form-message ${result.error ? "error" : ""}`}>{result.message}</div>}</div><div className="form-grid">
 <label>Your name *<input name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Full name" /></label>
 <label>Email address *<input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" /></label>
 <label>Phone number<input name="phone" type="tel" maxLength={30} autoComplete="tel" placeholder="Optional" /></label>
 <label>How can we help? *<select name="service" required defaultValue=""><option value="" disabled>Select a service</option>{services.map(s=><option key={s}>{s}</option>)}</select></label>
 <label>Project location *<input name="location" required minLength={2} maxLength={160} placeholder="City, country" /></label>
 <label>Estimated project budget<select name="budget" defaultValue="To be discussed">{["To be discussed","Under $100k","$100k–$500k","$500k–$1m","$1m+"].map(b=><option key={b}>{b}</option>)}</select></label>
 <label className="full">Tell us about your project *<textarea name="message" required minLength={20} maxLength={4000} rows={5} placeholder="Your ideas, the space you have in mind, and what matters most to you…" /></label>
 <label className="trap" aria-hidden="true">Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
 <label className="full check-label"><input type="checkbox" name="consent" required /><span>I agree to the <Link href="/privacy" className="underline">privacy policy</Link> and to being contacted about my project.</span></label>
 <button disabled={pending} className="button dark full" type="submit">{pending ? "Sending your request…" : "Request a consultation"}<Arrow /></button>
 </div><p className="image-note">Your project details are shared privately with the studio.</p></form>;
}
