import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: { default: "Forma — Architecture with intention", template: "%s | Forma Studio" }, description: "Considered architecture, thoughtful interiors, and a clear path from your first idea to your next space." };
export default function RootLayout({ children }: Readonly<{children:React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }

