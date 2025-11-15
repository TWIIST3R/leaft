import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createCheckoutSession, getOrCreateStripeCustomer } from "@/lib/stripe/subscriptions";
import { clientEnv } from "@/env";

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
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

    // Check if organization already exists
    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("clerk_organization_id", orgId)
      .single();

    let organizationId: string;

    if (existingOrg) {
      // Update organization name if it exists
      await supabase
        .from("organizations")
        .update({ name: organizationName })
        .eq("id", existingOrg.id);
      organizationId = existingOrg.id;
    } else {
      // Create organization in database
      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert({
          clerk_organization_id: orgId,
          name: organizationName,
        })
        .select("id")
        .single();

      if (orgError || !newOrg) {
        console.error("Error creating organization:", orgError);
        return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
      }

      organizationId = newOrg.id;
    }

    // Create or update user_organizations entry with Owner role
    const { error: userOrgError } = await supabase.from("user_organizations").upsert(
      {
        clerk_user_id: userId,
        organization_id: organizationId,
        role: "Owner",
      },
      {
        onConflict: "clerk_user_id,organization_id",
      },
    );

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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

