import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginForm from "@/components/LoginForm";
import { isConfigured } from "@/lib/supabase/server";
export const metadata={title:"Client portal",robots:{index:false,follow:false}};
export default function LoginPage(){return <><Header /><main className="auth-wrap"><div className="eyebrow">A SPACE FOR YOUR PROJECT</div><h1>Welcome back.</h1><p>Sign in to follow your consultation and stay connected with the studio.</p><LoginForm configured={isConfigured()} /></main><Footer /></>;}
