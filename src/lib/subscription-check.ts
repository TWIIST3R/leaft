import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hasActiveSubscription } from "@/lib/stripe/subscriptions";
import { stripe } from "@/lib/stripe";

/**
 * Check if current user's organization has active subscription
 * Returns organization ID if subscription is active, null otherwise
 * Also checks Stripe directly if subscription not found in DB (webhook might be delayed)
 */
export async function checkSubscriptionAccess() {
  const { userId, orgId } = await auth();

  console.log("checkSubscriptionAccess called:", { userId, orgId });

  if (!userId || !orgId) {
    console.log("checkSubscriptionAccess: not authenticated", { userId, orgId });
    return { hasAccess: false, organizationId: null, reason: "not_authenticated" as const };
  }

  // Use admin client to bypass RLS for organization lookup
  // This ensures we can find the organization even if user is not yet in employees table
  const supabase = supabaseAdmin();

  // Get organization from database
  const { data: organization, error } = await supabase
    .from("organizations")
    .select("id, stripe_customer_id, clerk_organization_id")
    .eq("clerk_organization_id", orgId)
    .single();

  console.log("checkSubscriptionAccess: organization lookup", {
    orgId,
    organization,
    error,
  });

  if (error || !organization) {
    console.log("checkSubscriptionAccess: organization not found", { error, orgId });
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

