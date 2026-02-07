"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function DashboardTopbar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-[color:rgba(11,11,11,0.45)]">Espace RH</p>
        <h1 className="text-lg font-semibold text-[var(--text)]">Pilotage des talents & rémunérations</h1>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/parametres"
          className="inline-flex cursor-pointer items-center rounded-full border border-[#e2e7e2] px-4 py-2 text-sm font-medium text-[color:rgba(11,11,11,0.7)] transition hover:bg-[#f2f5f2]"
        >
          Paramétrage
        </Link>
        <SignedIn>
          <UserButton appearance={{ elements: { userButtonBox: "ml-2" } }} afterSignOutUrl="/" />
        </SignedIn>
        <SignedOut>
          <Link
            href="/sign-in"
            className="inline-flex items-center rounded-full border border-[#e2e7e2] px-4 py-2 text-sm font-medium text-[color:rgba(11,11,11,0.7)] transition hover:bg-[#f2f5f2]"
          >
            Se connecter
          </Link>
        </SignedOut>
      </div>
    </div>
  );
}

