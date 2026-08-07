"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/recall", label: "Recall Trace" },
  { href: "/upstream", label: "Store Upstream" },
  { href: "/path", label: "Farm → Store" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="brand-lockup">
        <Link href="/" className="brand">
          Cascade
        </Link>
        <p className="brand-tag">Supply chain recall tracer</p>
      </div>
      <nav className="nav-links" aria-label="Primary">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={active ? "nav-link active" : "nav-link"}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
