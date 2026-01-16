import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hasActiveSubscription } from "@/lib/stripe/subscriptions";

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ exists: false, hasSubscription: false });
    }

    // Use admin client to bypass RLS for organization lookup
    const supabase = supabaseAdmin();

    let organization;

    // If orgId is provided, use it directly
    if (orgId) {
      const { data, error } = await supabase
        .from("organizations")
        .select("id")
        .eq("clerk_organization_id", orgId)
        .single();

      if (!error && data) {
        organization = data;
      }
    }

    // If organization not found by orgId (or orgId is undefined),
    // try to find it via user_organizations table
    if (!organization) {
      const { data: userOrg, error: userOrgError } = await supabase
        .from("user_organizations")
        .select("organization_id, organizations(id)")
        .eq("clerk_user_id", userId)
        .maybeSingle();

      if (!userOrgError && userOrg?.organizations) {
        organization = Array.isArray(userOrg.organizations) ? userOrg.organizations[0] : userOrg.organizations;
      }
    }

    if (!organization) {
      return NextResponse.json({ exists: false, hasSubscription: false });
    }

    // Check if has active subscription
    const isActive = await hasActiveSubscription(organization.id);

    return NextResponse.json({
      exists: true,
      hasSubscription: isActive,
      organizationId: organization.id,
    });
  } catch (error) {
    console.error("Error checking organization:", error);
    return NextResponse.json({ exists: false, hasSubscription: false });
  }
}

