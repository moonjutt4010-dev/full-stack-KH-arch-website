import Link from "next/link";
import { Mark } from "./Icons";
export default function Footer() { return <footer className="site-footer"><Link className="brand" href="/"><Mark /><span>forma<span className="brand-sub">ARCHITECTURE STUDIO</span></span></Link><span>Thoughtful by design.</span><div><Link href="/privacy">Privacy policy</Link><Link href="/login">Client portal ?</Link><span>© {new Date().getFullYear()} Forma Studio</span></div></footer>; }

