import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createCheckoutSession, getOrCreateStripeCustomer } from "@/lib/stripe/subscriptions";
import { supabaseServer } from "@/lib/supabase/server";
import { clientEnv } from "@/env";

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "Organization required" }, { status: 400 });
    }

    const body = await request.json();
    const { seatCount, planType } = body;

    if (!seatCount || !planType || (planType !== "monthly" && planType !== "annual")) {
      return NextResponse.json({ error: "Invalid request: seatCount and planType required" }, { status: 400 });
    }

    const supabase = await supabaseServer();

    // Get organization from database
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, stripe_customer_id")
      .eq("clerk_organization_id", orgId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress || "";

    // Get or create Stripe customer
    const customer = await getOrCreateStripeCustomer(organization.id, email, organization.name);

    // Create checkout session
    const session = await createCheckoutSession(
      organization.id,
      customer.id,
      seatCount,
      planType,
      `${clientEnv.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      `${clientEnv.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

