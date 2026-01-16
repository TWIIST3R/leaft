import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabase/server";
import { syncSubscriptionFromStripe } from "@/lib/stripe/subscriptions";

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    // Get organization from database
    const supabase = await supabaseServer();
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("clerk_organization_id", orgId)
      .single();

    if (orgError || !organization) {
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

    return NextResponse.json({ success: true, synced: true });
  } catch (error) {
    console.error("Error verifying session:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Internal server error", details: errorMessage }, { status: 500 });
  }
}
