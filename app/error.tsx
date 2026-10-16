"use client";
import Link from "next/link";
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="section-wrap"><div className="eyebrow">A MOMENT PLEASE</div><h1>We couldn’t load this space.</h1><p className="body-copy">Please try again. If the issue continues, contact the studio.</p><div className="toolbar"><button onClick={reset}>Try again</button><Link className="text-link" href="/">Return home →</Link></div></main>;}
