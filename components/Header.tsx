import Link from "next/link";
import { Arrow, Mark } from "./Icons";
export default function Header() {
 return <header className="site-header"><Link href="/" className="brand" aria-label="Forma Studio home"><Mark /><span>forma<span className="brand-sub">ARCHITECTURE STUDIO</span></span></Link><nav className="desktop-nav" aria-label="Main navigation"><Link href="/">Home</Link><Link href="/work">Our work</Link><Link href="/services">Expertise</Link><Link href="/about">The studio</Link></nav><div className="header-actions"><Link className="portal-link" href="/login">Client portal <span>?</span></Link><Link className="button dark small" href="/contact">Let’s talk <Arrow /></Link></div><details className="mobile-menu"><summary aria-label="Open navigation">?</summary><nav aria-label="Mobile navigation"><Link href="/">Home</Link><Link href="/work">Our work</Link><Link href="/services">Expertise</Link><Link href="/about">The studio</Link><Link href="/login">Client portal</Link><Link href="/contact">Let’s talk ?</Link></nav></details></header>;
}

