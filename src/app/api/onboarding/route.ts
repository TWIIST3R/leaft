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
    const { organizationName, employeeCount, planType } = body;

    if (!organizationName || !employeeCount || !planType) {
      return NextResponse.json(
        { error: "Missing required fields: organizationName, employeeCount, planType" },
        { status: 400 },
      );
    }

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

    // Create organization in Supabase
    // The organization is created for the first time during onboarding
    const { data: newOrg, error: orgError } = await supabase
      .from("organizations")
      .insert({
        clerk_organization_id: clerkOrgId,
        name: organizationName,
      })
      .select("id")
      .single();

    if (orgError || !newOrg) {
      console.error("Error creating organization in Supabase:", orgError);
      return NextResponse.json(
        { error: "Failed to create organization in database", details: orgError?.message },
        { status: 500 },
      );
    }

    const organizationId = newOrg.id;

    // Create user_organizations entry with Owner role
    // The admin who creates the organization becomes the Owner
    const { error: userOrgError } = await supabase.from("user_organizations").insert({
      clerk_user_id: userId,
      organization_id: organizationId,
      role: "Owner",
    });

    if (userOrgError) {
      console.error("Error creating user_organizations:", userOrgError);
      return NextResponse.json({ error: "Failed to create user organization" }, { status: 500 });
    }

    // Get user email for Stripe customer
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress || "";

    // Get or create Stripe customer
    const customer = await getOrCreateStripeCustomer(organizationId, email, organizationName);

    // Create checkout session
    const session = await createCheckoutSession(
      organizationId,
      customer.id,
      employeeCount,
      planType,
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

