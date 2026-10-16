import Header from "@/components/Header";
import PasswordForm from "@/components/PasswordForm";
import { requireUser } from "@/lib/auth";
export const dynamic="force-dynamic";
export const metadata={title:"Set your password",robots:{index:false,follow:false}};
export default async function AccountPage(){await requireUser();return <><Header/><main className="auth-wrap"><div className="eyebrow">YOUR PRIVATE WORKSPACE</div><h1>Make yourself at home.</h1><p>Choose a strong password with at least 12 characters.</p><PasswordForm/></main></>;}
