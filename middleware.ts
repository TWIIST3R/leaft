import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkSubscriptionAccess } from "@/lib/subscription-check";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

async function getUserRole(userId: string, orgId: string | null | undefined): Promise<"admin" | "member" | null> {
  const supabase = supabaseAdmin();
  let organizationId: string | null = null;

  if (orgId) {
    const { data } = await supabase.from("organizations").select("id").eq("clerk_organization_id", orgId).single();
    if (data) organizationId = data.id;
  }
  if (!organizationId) {
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("organization_id, role")
      .eq("clerk_user_id", userId)
      .maybeSingle();
    if (userOrg) {
      return userOrg.role === "member" ? "member" : "admin";
    }
    return null;
  }

  const { data: userOrg } = await supabase
    .from("user_organizations")
    .select("role")
    .eq("clerk_user_id", userId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (userOrg) {
    return userOrg.role === "member" ? "member" : "admin";
  }
  return null;
}

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) return;

  const { userId, orgId, orgRole, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: request.url });
  }

  let effectiveRole: "admin" | "member" | null = null;
  if (orgRole === "org:admin") {
    effectiveRole = "admin";
  } else if (orgRole) {
    effectiveRole = "member";
  }

  if (isDashboardRoute(request) || isTalentSpaceRoute(request)) {
    if (!effectiveRole) {
      effectiveRole = await getUserRole(userId, orgId);
    }
  }

  if (isDashboardRoute(request)) {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session_id");
    if (sessionId) return;

    if (effectiveRole === "member") {
      return NextResponse.redirect(new URL("/espace-talent", request.url));
    }

    if (effectiveRole === "admin" || !effectiveRole) {
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
  }

  if (isTalentSpaceRoute(request)) {
    if (effectiveRole === "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)).*)",
  ],
};
