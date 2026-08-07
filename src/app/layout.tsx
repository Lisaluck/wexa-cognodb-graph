import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { DbBanner } from "@/components/DbBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cascade — Supply Chain Recall Tracer",
  description:
    "Explore food supply chains and trace contamination events across farms, facilities, and retailers on CognoDB.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Nav />
          <DbBanner />
          {children}
          <p className="footer-note">
            Cascade · graph-backed recall tracing on CognoDB
          </p>
        </div>
      </body>
    </html>
  );
}
