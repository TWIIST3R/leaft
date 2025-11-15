import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";
import { hasActiveSubscription } from "@/lib/stripe/subscriptions";

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ exists: false, hasSubscription: false });
    }

    // If no orgId in Clerk, organization doesn't exist yet
    if (!orgId) {
      return NextResponse.json({ exists: false, hasSubscription: false });
    }

    const supabase = await supabaseServer();

    // Check if organization exists in database
    const { data: organization, error } = await supabase
      .from("organizations")
      .select("id")
      .eq("clerk_organization_id", orgId)
      .single();

    if (error || !organization) {
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

