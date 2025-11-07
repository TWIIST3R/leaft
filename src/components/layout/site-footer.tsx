import Link from "next/link";

const footerLinks = [
  { href: "/pricing", label: "Prix" },
  { href: "/contact", label: "Contact" },
  { href: "/legal", label: "Mentions légales" },
  { href: "/privacy", label: "Confidentialité" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-[color:rgba(11,11,11,0.68)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <p>© {new Date().getFullYear()} Leaft. Tous droits réservés.</p>
        <div className="flex flex-wrap items-center gap-4">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-[var(--text)]">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

