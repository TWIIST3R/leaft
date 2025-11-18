import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createBillingPortalSession, getOrCreateStripeCustomer } from "@/lib/stripe/subscriptions";
import { supabaseServer } from "@/lib/supabase/server";
import { clientEnv } from "@/env";

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    if (!organization.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
    }

    // Create billing portal session
    const portalUrl = await createBillingPortalSession(
      organization.id,
      organization.stripe_customer_id,
      `${clientEnv.NEXT_PUBLIC_APP_URL}/dashboard`,
    );

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

