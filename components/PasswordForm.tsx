"use client";
import { useActionState } from "react";
import { setPassword } from "@/app/account/actions";
export default function PasswordForm(){const [state,action,pending]=useActionState(setPassword,{error:""});return <form action={action}><div aria-live="polite">{state.error&&<div className="form-message error">{state.error}</div>}</div><label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required/></label><label>Confirm password<input name="confirm" type="password" autoComplete="new-password" minLength={12} maxLength={128} required/></label><button className="button dark" disabled={pending}>{pending ? "Saving…" : "Set password & continue →"}</button></form>;}
