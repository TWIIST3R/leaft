import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { syncSubscriptionFromStripe } from "@/lib/stripe/subscriptions";

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    // Get organization from database
    // Use admin client to bypass RLS and find org even if orgId is undefined
    const supabase = supabaseAdmin();
    let organization;
    let clerkOrgId: string | undefined;

    // If orgId is provided, use it directly
    if (orgId) {
      const { data, error: orgError } = await supabase
        .from("organizations")
        .select("id, clerk_organization_id")
        .eq("clerk_organization_id", orgId)
        .single();

      if (!orgError && data) {
        organization = data;
        clerkOrgId = data.clerk_organization_id;
      }
    }

    // If organization not found by orgId (or orgId is undefined),
    // try to find it via user_organizations table
    if (!organization) {
      const { data: userOrg, error: userOrgError } = await supabase
        .from("user_organizations")
        .select("organization_id, organizations(id, clerk_organization_id)")
        .eq("clerk_user_id", userId)
        .maybeSingle();

      if (!userOrgError && userOrg?.organizations) {
        organization = Array.isArray(userOrg.organizations) ? userOrg.organizations[0] : userOrg.organizations;
        if (organization && 'clerk_organization_id' in organization) {
          clerkOrgId = organization.clerk_organization_id;
        }
      }
    }

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session.subscription) {
      return NextResponse.json({ error: "No subscription found in session" }, { status: 400 });
    }

    // Retrieve the subscription from Stripe with expanded customer
    const subscription = await stripe.subscriptions.retrieve(
      typeof session.subscription === "string" ? session.subscription : session.subscription.id,
      {
        expand: ["customer"],
      },
    );

    console.log("Retrieved subscription for verification:", {
      subscriptionId: subscription.id,
      status: subscription.status,
      metadata: subscription.metadata,
      customerMetadata: typeof subscription.customer === "object" && !subscription.customer.deleted
        ? subscription.customer.metadata
        : null,
    });

    // Check if subscription is active
    if (subscription.status !== "active" && subscription.status !== "trialing") {
      return NextResponse.json({ error: "Subscription is not active" }, { status: 400 });
    }

    // Sync subscription to database (this will upsert, so it's safe to call multiple times)
    try {
      await syncSubscriptionFromStripe(subscription);
      console.log("Subscription synced successfully in verify-session");
    } catch (syncError) {
      console.error("Error syncing subscription in verify-session:", syncError);
      return NextResponse.json(
        { error: "Failed to sync subscription", details: syncError instanceof Error ? syncError.message : String(syncError) },
        { status: 500 },
      );
    }

    // Return organization ID so client can set it as active
    return NextResponse.json({ 
      success: true, 
      synced: true,
      orgId: organization.clerk_organization_id || clerkOrgId,
    });
  } catch (error) {
    console.error("Error verifying session:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Internal server error", details: errorMessage }, { status: 500 });
  }
}
