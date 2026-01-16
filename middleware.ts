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
  "/api/stripe/webhook", // Stripe webhooks don't need auth
  "/api/stripe/verify-session", // Allow verification endpoint
  "/api/onboarding(.*)", // Allow onboarding API
  "/api/stripe/checkout", // Allow checkout creation
]);

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  // Allow public routes
  if (isPublicRoute(request)) return;

  const { userId, orgId, redirectToSignIn } = await auth();
  
  // Require authentication
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: request.url });
  }

  // For dashboard routes, check subscription
  if (isDashboardRoute(request)) {
    // Allow access if no orgId (user might be in onboarding)
    if (!orgId) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // Check if there's a session_id in the URL (coming from Stripe checkout)
    // In this case, allow access temporarily - the dashboard-client will handle verification
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session_id");
    
    if (sessionId) {
      // Allow access if coming from checkout - dashboard-client will verify and sync
      return;
    }

    // Check subscription access
    const { hasAccess, reason } = await checkSubscriptionAccess();
    
    if (!hasAccess) {
      // Redirect to onboarding if no subscription
      if (reason === "no_subscription" || reason === "organization_not_found") {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
      // For other reasons (not authenticated), redirect to sign in
      if (reason === "not_authenticated") {
        return redirectToSignIn({ returnBackUrl: request.url });
      }
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)).*)",
  ],
};

