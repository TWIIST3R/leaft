import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hasActiveSubscription } from "@/lib/stripe/subscriptions";
import { stripe } from "@/lib/stripe";

/**
 * Check if current user's organization has active subscription
 * Returns organization ID if subscription is active, null otherwise
 * Also checks Stripe directly if subscription not found in DB (webhook might be delayed)
 * 
 * @param userId - User ID from Clerk (optional, will be fetched if not provided)
 * @param orgId - Organization ID from Clerk session (optional, will be fetched if not provided)
 */
export async function checkSubscriptionAccess(userId?: string, orgId?: string) {
  // If userId/orgId not provided, fetch from auth (but avoid calling auth() in middleware context)
  // Only call auth() if userId is not provided (not called from middleware)
  if (!userId) {
    try {
      const authResult = await auth();
      userId = authResult.userId ?? undefined;
      orgId = orgId ?? authResult.orgId ?? undefined;
    } catch (error) {
      // If auth() fails (e.g., in middleware context), use provided values or return error
      console.error("Error calling auth() in checkSubscriptionAccess:", error);
      if (!userId) {
        return { hasAccess: false, organizationId: null, reason: "not_authenticated" as const };
      }
    }
  }

  console.log("checkSubscriptionAccess called:", { userId, orgId });

  if (!userId) {
    console.log("checkSubscriptionAccess: not authenticated", { userId });
    return { hasAccess: false, organizationId: null, reason: "not_authenticated" as const };
  }

  // Use admin client to bypass RLS for organization lookup
  // This ensures we can find the organization even if user is not yet in employees table
  const supabase = supabaseAdmin();

  let organization;

  // If orgId is provided in session, use it directly
  if (orgId) {
    const { data, error } = await supabase
      .from("organizations")
      .select("id, stripe_customer_id, clerk_organization_id")
      .eq("clerk_organization_id", orgId)
      .single();

    console.log("checkSubscriptionAccess: organization lookup by orgId", {
      orgId,
      organization: data,
      error,
    });

    if (error || !data) {
      console.log("checkSubscriptionAccess: organization not found by orgId", { error, orgId });
    } else {
      organization = data;
    }
  }

  // If organization not found by orgId (or orgId not in session),
  // try to find it via user_organizations table
  if (!organization) {
    console.log("checkSubscriptionAccess: trying to find organization via user_organizations");
    const { data: userOrg, error: userOrgError } = await supabase
      .from("user_organizations")
      .select("organization_id, organizations(id, stripe_customer_id, clerk_organization_id)")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    console.log("checkSubscriptionAccess: user_organizations lookup", {
      userOrg,
      userOrgError,
    });

    if (!userOrgError && userOrg?.organizations) {
      organization = Array.isArray(userOrg.organizations) ? userOrg.organizations[0] : userOrg.organizations;
      console.log("checkSubscriptionAccess: found organization via user_organizations", { organization });
    }
  }

  if (!organization) {
    console.log("checkSubscriptionAccess: organization not found");
    return { hasAccess: false, organizationId: null, reason: "organization_not_found" as const };
  }

  // First check in database
  const isActive = await hasActiveSubscription(organization.id);

  console.log("checkSubscriptionAccess result:", {
    organizationId: organization.id,
    isActive,
    stripeCustomerId: organization.stripe_customer_id,
    clerkOrgId: organization.clerk_organization_id,
  });

  if (isActive) {
    console.log("checkSubscriptionAccess: subscription is active, granting access");
    return {
      hasAccess: true,
      organizationId: organization.id,
      reason: "active" as const,
    };
  }

  // If not found in DB, check directly in Stripe (webhook might be delayed)
  if (organization.stripe_customer_id) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: organization.stripe_customer_id,
        status: "all",
        limit: 1,
      });

      const activeSubscription = subscriptions.data.find(
        (sub) => sub.status === "active" || sub.status === "trialing",
      );

      if (activeSubscription) {
        // Import sync function to sync the subscription
        const { syncSubscriptionFromStripe } = await import("@/lib/stripe/subscriptions");
        await syncSubscriptionFromStripe(activeSubscription);

        return {
          hasAccess: true,
          organizationId: organization.id,
          reason: "active" as const,
        };
      }
    } catch (error) {
      console.error("Error checking Stripe subscription:", error);
      // Continue to return no subscription if Stripe check fails
    }
  }

  return {
    hasAccess: false,
    organizationId: organization.id,
    reason: "no_subscription" as const,
  };
}

