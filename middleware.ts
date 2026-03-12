import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkSubscriptionAccess } from "@/lib/subscription-check";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/contact",
  "/resources",
  "/legal",
  "/privacy",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)",
  "/api/stripe/webhook",
  "/api/clerk/webhook",
  "/api/stripe/verify-session",
  "/api/onboarding(.*)",
  "/api/stripe/checkout",
]);

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);
const isTalentSpaceRoute = createRouteMatcher(["/espace-talent(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) return;

  const { userId, orgId, orgRole, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: request.url });
  }

  if (isDashboardRoute(request)) {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session_id");

    if (sessionId) {
      return;
    }

    if (orgRole && orgRole !== "org:admin") {
      return NextResponse.redirect(new URL("/espace-talent", request.url));
    }

    const { hasAccess, reason } = await checkSubscriptionAccess(userId ?? undefined, orgId ?? undefined);

    if (!hasAccess) {
      if (reason === "no_subscription" || reason === "organization_not_found") {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
      if (reason === "not_authenticated") {
        return redirectToSignIn({ returnBackUrl: request.url });
      }
    }
  }

  if (isTalentSpaceRoute(request)) {
    if (orgRole === "org:admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)).*)",
  ],
};
