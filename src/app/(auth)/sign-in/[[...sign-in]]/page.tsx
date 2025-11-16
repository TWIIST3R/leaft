"use client";

import { SignIn } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8f6] px-4">
      <div className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.08)]">
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" localization={frFR} />
      </div>
    </div>
  );
}

