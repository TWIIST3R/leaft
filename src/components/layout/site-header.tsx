"use client";

import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/pricing", label: "Prix" },
  { href: "/contact", label: "Contact" },
  { href: "/resources", label: "Ressources" },
];

export function SiteHeader() {
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    // Only check subscription if user is signed in
    if (!isLoaded || !isSignedIn) {
      setHasSubscription(false);
      return;
    }

    // Check if user has active subscription
    const checkSubscription = async () => {
      try {
        const response = await fetch("/api/onboarding/check");
        if (response.ok) {
          const data = await response.json();
          console.log("Header subscription check:", data);
          setHasSubscription(data.hasSubscription ?? false);
        } else {
          console.error("Header subscription check failed:", response.status, response.statusText);
          setHasSubscription(false);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        setHasSubscription(false);
      }
    };

    checkSubscription();
    
    // Re-check subscription periodically in case it was just created
    const interval = setInterval(() => {
      if (isSignedIn) {
        checkSubscription();
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [isSignedIn, isLoaded]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/brand/logo-dark.png"
            width={140}
            height={56}
            alt="Leaft"
            priority
          />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-[color:rgba(11,11,11,0.76)] sm:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-[var(--text)]">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 sm:flex">
          <div className="flex items-center gap-3">
            <SignedOut>
              <Link
                href="/sign-in"
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-muted"
              >
                Connexion
              </Link>
            </SignedOut>
            <SignedIn>
              {/* Only show dashboard link if user has active subscription */}
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
        </div>
      </div>
    </header>
  );
}

