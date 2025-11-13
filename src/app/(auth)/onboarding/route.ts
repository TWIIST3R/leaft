import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * This route handles post-signup flow:
 * 1. Create organization in database if it doesn't exist
 * 2. Create user_organizations entry with Owner role
 * 3. Redirect to Stripe checkout
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      redirect("/sign-up");
    }

    const supabase = await supabaseServer();

    // Get organization name from Clerk
    let organizationName = "Mon entreprise";
    try {
      const organization = await clerkClient().organizations.getOrganization({ organizationId: orgId });
      organizationName = organization.name || "Mon entreprise";
    } catch (error) {
      console.error("Error fetching organization from Clerk:", error);
      // Use default name
    }

    // Check if organization already exists in database
    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("clerk_organization_id", orgId)
      .single();

    let organizationId: string;

    if (existingOrg) {
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
        redirect("/sign-up?error=organization_creation_failed");
      }

      organizationId = newOrg.id;
    }

    // Create or update user_organizations entry with Owner role
    await supabase.from("user_organizations").upsert(
      {
        clerk_user_id: userId,
        organization_id: organizationId,
        role: "Owner",
      },
      {
        onConflict: "clerk_user_id,organization_id",
      },
    );

    // Redirect to pricing page to select plan
    redirect("/pricing?onboarding=true");
  } catch (error) {
    console.error("Error in onboarding:", error);
    redirect("/sign-up?error=onboarding_failed");
  }
}

