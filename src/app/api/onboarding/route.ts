import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createCheckoutSession, getOrCreateStripeCustomer } from "@/lib/stripe/subscriptions";
import { clientEnv } from "@/env";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { organizationName, businessName, taxId, employeeCount, planType } = body;

    if (!organizationName || !businessName || !taxId || !planType) {
      return NextResponse.json(
        { error: "Missing required fields: organizationName, businessName, taxId, planType" },
        { status: 400 },
      );
    }

    // Default to 1 talent at onboarding; user can add more later from dashboard (no new checkout)
    const seatCount = typeof employeeCount === "number" && employeeCount >= 1 ? employeeCount : 1;

    if (planType !== "monthly" && planType !== "annual") {
      return NextResponse.json({ error: "Invalid planType" }, { status: 400 });
    }

    const supabase = await supabaseServer();

    // Create organization in Clerk
    // The admin creates the organization during onboarding (never exists before)
    // Note: createdBy automatically adds the user as admin
    let clerkOrgId: string;
    try {
      const clerk = await clerkClient();
      const organization = await clerk.organizations.createOrganization({
        name: organizationName,
        createdBy: userId,
      });
      clerkOrgId = organization.id;
    } catch (error) {
      console.error("Error creating Clerk organization:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        {
          error: "Failed to create organization in Clerk",
          details: errorMessage,
        },
        { status: 500 },
      );
    }

    // Create organization in Supabase using RPC function
    // This function bypasses RLS in a controlled way and creates both
    // the organization and the user_organizations entry
    const { data: newOrg, error: orgError } = await supabase.rpc("create_organization_onboarding", {
      p_clerk_organization_id: clerkOrgId,
      p_organization_name: organizationName,
      p_clerk_user_id: userId,
    });

    if (orgError || !newOrg || newOrg.length === 0) {
      console.error("Error creating organization in Supabase:", orgError);
      return NextResponse.json(
        { error: "Failed to create organization in database", details: orgError?.message },
        { status: 500 },
      );
    }

    const organizationId = newOrg[0].id;

    // Get user email for Stripe customer
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress || "";

    // Get or create Stripe customer
    const customer = await getOrCreateStripeCustomer(organizationId, email, businessName);

    // Create checkout session (1 talent by default)
    const session = await createCheckoutSession(
      organizationId,
      customer.id,
      seatCount,
      planType,
      businessName,
      taxId,
      `${clientEnv.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      `${clientEnv.NEXT_PUBLIC_APP_URL}/onboarding?canceled=true`,
    );

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("Error in onboarding:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}

