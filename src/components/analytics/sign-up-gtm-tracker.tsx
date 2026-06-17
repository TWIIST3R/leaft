"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { trackSignUpComplete } from "@/lib/analytics/data-layer";

/** Déclenche sign_up_complete quand l'utilisateur vient de créer son compte Clerk sur /sign-up. */
export function SignUpGtmTracker() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const wasSignedIn = useRef<boolean | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const justSignedUp = wasSignedIn.current === false && isSignedIn && Boolean(userId);
    wasSignedIn.current = isSignedIn;

    if (!justSignedUp || !user) return;

    void trackSignUpComplete({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.primaryEmailAddress?.emailAddress ?? "",
      phone: user.primaryPhoneNumber?.phoneNumber ?? "",
    });
  }, [isLoaded, isSignedIn, userId, user]);

  return null;
}
