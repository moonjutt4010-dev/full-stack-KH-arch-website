"use client";
import { useActionState } from "react";
import { signIn } from "@/app/login/actions";
import { Arrow } from "./Icons";
export default function LoginForm({configured}:{configured:boolean}) {
 const [state,action,pending] = useActionState(signIn,{error:""});
 return <form action={action}><div aria-live="polite">{state.error && <div className="form-message error">{state.error}</div>}{!configured && <div className="form-message">The client portal is being configured. Access will be available once setup is complete.</div>}</div><label>Email address<input name="email" type="email" required autoComplete="username" maxLength={254} /></label><label>Password<input name="password" type="password" required autoComplete="current-password" maxLength={128} /></label><button disabled={pending || !configured} type="submit" className="button dark">{pending ? "Signing in…" : "Sign in securely"}<Arrow /></button><p>Access is by invitation. Contact the studio to set up your account or recover access.</p></form>;
}
