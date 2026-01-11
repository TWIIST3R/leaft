import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createCheckoutSession, getOrCreateStripeCustomer } from "@/lib/stripe/subscriptions";
import { supabaseServer } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
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

    // Retrieve customer from Stripe to get business information if available
    const stripeCustomer = await stripe.customers.retrieve(customer.id);
    
    // Check if customer is deleted
    if (stripeCustomer.deleted) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    
    const businessName = stripeCustomer.name || organization.name;
    
    // Try to get tax ID from customer's tax_ids
    let taxId = "";
    if (stripeCustomer.tax_ids && stripeCustomer.tax_ids.data && stripeCustomer.tax_ids.data.length > 0) {
      taxId = stripeCustomer.tax_ids.data[0].value;
    }
    
    // If no tax ID in Stripe, use empty string (will be collected in checkout)
    // Note: Stripe Checkout will still collect tax ID even if we pass an empty string
    // because tax_id_collection is enabled

    // Create checkout session
    // Note: If taxId is empty, Stripe Checkout will still collect it because tax_id_collection is enabled
    const session = await createCheckoutSession(
      organization.id,
      customer.id,
      seatCount,
      planType,
      businessName,
      taxId, // Empty string if not found, will be collected in checkout
      `${clientEnv.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      `${clientEnv.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

