import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";
import { hasActiveSubscription } from "@/lib/stripe/subscriptions";

/**
 * Check if current user's organization has active subscription
 * Returns organization ID if subscription is active, null otherwise
 */
export async function checkSubscriptionAccess() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return { hasAccess: false, organizationId: null, reason: "not_authenticated" as const };
  }

  const supabase = await supabaseServer();

  // Get organization from database
  const { data: organization, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("clerk_organization_id", orgId)
    .single();

  if (error || !organization) {
    return { hasAccess: false, organizationId: null, reason: "organization_not_found" as const };
  }

  const isActive = await hasActiveSubscription(organization.id);

  return {
    hasAccess: isActive,
    organizationId: organization.id,
    reason: isActive ? ("active" as const) : ("no_subscription" as const),
  };
}

