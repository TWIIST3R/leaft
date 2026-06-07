"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/pricing", label: "Prix" },
  { href: "/resources", label: "Ressources" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await fetch("/api/onboarding/check");
        if (response.ok) {
          const data = await response.json();
          setHasSubscription(data.hasSubscription ?? false);
        } else {
          setHasSubscription(false);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        setHasSubscription(false);
      }
    };

    checkSubscription();
  }, []);

  // Ferme le menu mobile à chaque changement de page.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Empêche le scroll de l'arrière-plan quand le menu mobile est ouvert.
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brand/logo-dark.png" width={140} height={56} alt="Leaft" priority />
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-[color:rgba(11,11,11,0.76)] md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-[var(--text)]">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions desktop */}
        <div className="hidden items-center gap-3 md:flex">
          <SignedOut>
            <Link
              href="/sign-in?redirect_url=/dashboard"
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-muted"
            >
              Connexion
            </Link>
          </SignedOut>
          <SignedIn>
            {hasSubscription && (
              <Link
                href="/dashboard"
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-muted"
              >
                Accéder au dashboard
              </Link>
            )}
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <Link
            href="/contact"
            className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Demander une démo
          </Link>
        </div>

        {/* Bouton burger mobile */}
        <button
          type="button"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-[var(--text)] transition hover:bg-muted md:hidden"
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Panneau mobile */}
      {menuOpen && (
        <div className="md:hidden">
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-x-0 bottom-0 top-16 z-30 bg-black/30 backdrop-blur-sm"
          />
          <nav className="relative z-40 flex flex-col gap-1 border-b border-border bg-white px-4 pb-6 pt-2 shadow-[var(--shadow)]">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[var(--radius)] px-3 py-3 text-base font-medium text-[var(--text)] transition hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-3 border-t border-border pt-4">
              <SignedOut>
                <Link
                  href="/sign-in?redirect_url=/dashboard"
                  className="rounded-full border border-border px-4 py-3 text-center text-sm font-medium text-[var(--text)] transition hover:bg-muted"
                >
                  Connexion
                </Link>
              </SignedOut>
              <SignedIn>
                {hasSubscription && (
                  <Link
                    href="/dashboard"
                    className="rounded-full border border-border px-4 py-3 text-center text-sm font-medium text-[var(--text)] transition hover:bg-muted"
                  >
                    Accéder au dashboard
                  </Link>
                )}
                <div className="flex items-center justify-center py-1">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
              <Link
                href="/contact"
                className="rounded-full bg-[var(--brand)] px-4 py-3 text-center text-sm font-semibold text-white transition hover:brightness-110"
              >
                Demander une démo
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
