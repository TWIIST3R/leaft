import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createBillingPortalSession } from "@/lib/stripe/subscriptions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { clientEnv } from "@/env";

async function getOrganizationId(userId: string, orgId: string | null) {
  const supabase = supabaseAdmin();
  if (orgId) {
    const { data } = await supabase.from("organizations").select("id").eq("clerk_organization_id", orgId).single();
    if (data) return data.id;
  }
  const { data: userOrg } = await supabase
    .from("user_organizations")
    .select("organization_id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  return userOrg?.organization_id ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await getOrganizationId(userId, orgId ?? null);
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const supabase = supabaseAdmin();

    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, stripe_customer_id")
      .eq("id", organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    let customerId = organization.stripe_customer_id as string | null;

    if (!customerId) {
      let subRows =
        (
          await supabase
            .from("subscriptions")
            .select("stripe_customer_id, stripe_subscription_id")
            .eq("organization_id", organizationId)
            .in("status", ["active", "trialing"])
            .order("updated_at", { ascending: false })
            .limit(1)
        ).data ?? [];

      if (subRows.length === 0) {
        subRows =
          (
            await supabase
              .from("subscriptions")
              .select("stripe_customer_id, stripe_subscription_id")
              .eq("organization_id", organizationId)
              .order("updated_at", { ascending: false })
              .limit(1)
          ).data ?? [];
      }

      const subAny = (subRows[0] ?? null) as
        | { stripe_customer_id?: string | null; stripe_subscription_id?: string | null }
        | null;
      if (subAny?.stripe_customer_id) {
        customerId = subAny.stripe_customer_id;
      } else if (subAny?.stripe_subscription_id) {
        try {
          const sub = await stripe.subscriptions.retrieve(subAny.stripe_subscription_id);
          customerId =
            typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
        } catch {
          customerId = null;
        }
      }

      if (customerId) {
        await supabase.from("organizations").update({ stripe_customer_id: customerId }).eq("id", organizationId);
      }
    }

    if (!customerId) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
    }

    // Create billing portal session
    const portalUrl = await createBillingPortalSession(
      organization.id,
      customerId,
      `${clientEnv.NEXT_PUBLIC_APP_URL}/dashboard`,
    );

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

