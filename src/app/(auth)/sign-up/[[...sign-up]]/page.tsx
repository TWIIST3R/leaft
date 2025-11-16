"use client";

import { SignUp } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8f6] px-4">
      <div className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.08)]">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/onboarding"
          localization={frFR}
          appearance={{
            elements: {
              rootBox: "mx-auto",
            },
          }}
        />
      </div>
    </div>
  );
}

