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
    console.log("Middleware: Dashboard route detected", {
      url: request.url,
      userId,
      orgId,
    });

    // Require userId for dashboard access
    if (!userId) {
      console.log("Middleware: No userId, redirecting to sign-in");
      return redirectToSignIn({ returnBackUrl: request.url });
    }

    // Check if there's a session_id in the URL (coming from Stripe checkout)
    // In this case, allow access temporarily - the dashboard-client will handle verification
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session_id");
    
    if (sessionId) {
      console.log("Middleware: session_id detected, allowing access for verification");
      // Allow access if coming from checkout - dashboard-client will verify and sync
      // Note: orgId might be undefined here, but checkSubscriptionAccess can find org via user_organizations
      return;
    }

    // Check subscription access (this function can find org even if orgId is undefined)
    // Pass userId and orgId to avoid calling auth() again inside checkSubscriptionAccess
    console.log("Middleware: Checking subscription access...");
    const { hasAccess, reason } = await checkSubscriptionAccess(userId, orgId);
    
    console.log("Middleware subscription check for dashboard:", {
      hasAccess,
      reason,
      url: request.url,
      orgId,
      userId,
    });
    
    if (!hasAccess) {
      // Redirect to onboarding if no subscription
      if (reason === "no_subscription" || reason === "organization_not_found") {
        console.log("Middleware: Redirecting to onboarding - no subscription or organization not found", { reason });
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
      // For other reasons (not authenticated), redirect to sign in
      if (reason === "not_authenticated") {
        console.log("Middleware: Redirecting to sign-in - not authenticated");
        return redirectToSignIn({ returnBackUrl: request.url });
      }
    } else {
      console.log("Middleware: Access granted to dashboard");
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)).*)",
  ],
};

